const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");
const { resolvePrice } = require("../utils/pricingResolver");

const parseDate = (value, label) => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${label}`, 400);
  }

  return parsed;
};

const mapId = (record) => {
  if (!record) {
    return record;
  }

  record._id = record.id;
  return record;
};

const decorateStay = (room, checkIn, checkOut) => {
  const stay = room.toObject ? room.toObject() : room;
  const resolvedPrice =
    checkIn && checkOut
      ? resolvePrice(stay, checkIn, checkOut)
      : stay.basePricePerNight ??
        stay.pricePerNight ??
        stay.nightlyRate ??
        stay.price ??
        null;

  return {
    ...stay,
    resolvedPrice,
  };
};

const AMENITY_LABEL_TO_FLAG = {
  "Wi-Fi": "wifi",
  "Breakfast Included": "breakfast",
  "Secure Parking": "parking",
  "Swimming Pool": "pool",
  "Air Conditioning": "aircon",
  "Conference Room": "conferenceRoom",
  "Airport Pickup": "airportPickup",
  "Family Friendly": "familyFriendly",
};

const matchesLocation = (providerProfile, location) => {
  if (!location) {
    return true;
  }

  const normalized = location.toLowerCase();
  return (
    providerProfile?.location?.province?.toLowerCase?.().includes(normalized) ||
    providerProfile?.location?.city?.toLowerCase?.().includes(normalized)
  );
};

const matchesAmenityFilters = (room, reqQuery) => {
  const amenityLabels = Array.isArray(reqQuery.amenities)
    ? reqQuery.amenities
    : typeof reqQuery.amenities === "string" && reqQuery.amenities.trim()
      ? [reqQuery.amenities]
      : [];

  const requiredFlags = new Set();

  amenityLabels.forEach((label) => {
    const flag = AMENITY_LABEL_TO_FLAG[label];

    if (flag) {
      requiredFlags.add(flag);
    }
  });

  [
    "wifi",
    "breakfast",
    "parking",
    "pool",
    "aircon",
    "conferenceRoom",
    "airportPickup",
    "familyFriendly",
  ].forEach((flag) => {
    if (reqQuery[flag] === "true") {
      requiredFlags.add(flag);
    }
  });

  return [...requiredFlags].every((flag) => room.amenities?.[flag] === true);
};

exports.searchStays = catchAsync(async (req, res, next) => {
  const checkIn = parseDate(req.query.checkIn, "checkIn");
  const checkOut = parseDate(req.query.checkOut, "checkOut");
  if ((checkIn && !checkOut) || (!checkIn && checkOut) || (checkIn && checkOut && checkIn >= checkOut)) {
    return next(new AppError("Valid checkIn and checkOut are required together", 400));
  }

  const providers = await prisma.user.findMany({
    where: { role: "provider" },
  });

  const location = req.query.location?.trim();
  const filteredProviders = providers.filter((user) => {
    if (user.providerProfile?.verificationStatus !== "approved") {
      return false;
    }

    if (
      req.query.businessType &&
      user.providerProfile?.businessType !== req.query.businessType
    ) {
      return false;
    }

    return matchesLocation(user.providerProfile, location);
  });

  const approvedProviderIds = filteredProviders.map((user) => user.id);

  let rooms = [];

  if (approvedProviderIds.length) {
    const minPrice = Number.parseFloat(req.query.minPrice);
    const maxPrice = Number.parseFloat(req.query.maxPrice);
    const basePricePerNight = {};

    if (Number.isFinite(minPrice)) {
      basePricePerNight.gte = minPrice;
    }

    if (Number.isFinite(maxPrice)) {
      basePricePerNight.lte = maxPrice;
    }

    rooms = await prisma.room.findMany({
      where: {
        providerId: { in: approvedProviderIds },
        status: "available",
        ...(req.query.guests ? { capacity: { gte: Number(req.query.guests) } } : {}),
        ...(Object.keys(basePricePerNight).length ? { basePricePerNight } : {}),
        ...(req.query.bookingMode ? { bookingMode: req.query.bookingMode } : {}),
      },
      include: {
        provider: {
          select: {
            id: true,
            providerProfile: true,
          },
        },
      },
    });

    rooms = rooms.filter((room) => matchesAmenityFilters(room, req.query));
  }

  if (checkIn && checkOut && rooms.length) {
    const roomIds = rooms.map((room) => room.id);

    const [bookings, blockedDates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          roomId: { in: roomIds },
          status: { in: ["confirmed", "pending_confirmation"] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      }),
      prisma.blockedDate.findMany({
        where: {
          roomId: { in: roomIds },
          startDate: { lt: checkOut },
          endDate: { gt: checkIn },
        },
      }),
    ]);

    const unavailableRoomIds = new Set([
      ...bookings.map((booking) => booking.roomId),
      ...blockedDates.map((blockedDate) => blockedDate.roomId),
    ]);

    rooms = rooms.filter((room) => !unavailableRoomIds.has(room.id));
  }

  rooms.forEach((room) => {
    mapId(room);
    mapId(room.provider);
  });

  const stays = rooms.map((room) => decorateStay(room, checkIn, checkOut));

  res.status(200).json({
    status: "success",
    results: stays.length,
    data: {
      stays,
    },
  });
});

exports.getProviderStays = catchAsync(async (req, res, next) => {
  const providerId = req.params.providerId;

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    select: { id: true, providerProfile: true },
  });

  if (!provider || provider.providerProfile?.verificationStatus !== "approved") {
    return next(new AppError("Provider not approved", 404));
  }

  mapId(provider);

  const rooms = await prisma.room.findMany({
    where: {
      providerId: provider.id,
      status: "available",
    },
    include: {
      provider: {
        select: {
          id: true,
          providerProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  rooms.forEach((room) => {
    mapId(room);
    mapId(room.provider);
  });

  const decoratedRooms = rooms.map((room) => decorateStay(room));

  res.status(200).json({
    status: "success",
    data: {
      provider: {
        ...provider.providerProfile,
        _id: provider.id,
      },
      rooms: decoratedRooms,
    },
  });
});
