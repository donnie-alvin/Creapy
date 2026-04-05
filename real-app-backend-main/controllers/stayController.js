const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const { resolvePrice } = require("../utils/pricingResolver");
const Room = require("../models/roomModel");
const Booking = require("../models/bookingModel");
const BlockedDate = require("../models/blockedDateModel");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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

const buildOverlapCondition = (startDate, endDate, fieldPairs) => ({
  $or: fieldPairs.map(([startField, endField]) => ({
    [startField]: { $lt: endDate },
    [endField]: { $gt: startDate },
  })),
});

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

exports.searchStays = catchAsync(async (req, res, next) => {
  const checkIn = parseDate(req.query.checkIn, "checkIn");
  const checkOut = parseDate(req.query.checkOut, "checkOut");
  if ((checkIn && !checkOut) || (!checkIn && checkOut) || (checkIn && checkOut && checkIn >= checkOut)) {
    return next(new AppError("Valid checkIn and checkOut are required together", 400));
  }

  const approvedProviderFilter = {
    role: "provider",
    "providerProfile.verificationStatus": "approved",
  };

  let providers = await User.find(approvedProviderFilter).select("_id");

  if (req.query.businessType) {
    providers = await User.find({
      ...approvedProviderFilter,
      "providerProfile.businessType": req.query.businessType,
    }).select("_id");
  }

  const location = req.query.location?.trim();
  if (location) {
    const locationRegex = new RegExp(location, "i");
    providers = await User.find({
      ...approvedProviderFilter,
      ...(req.query.businessType
        ? { "providerProfile.businessType": req.query.businessType }
        : {}),
      $or: [
        { "providerProfile.location.province": locationRegex },
        { "providerProfile.location.city": locationRegex },
      ],
    }).select("_id");
  }

  const approvedProviderIds = providers.map((provider) => provider._id);

  let rooms = [];

  if (approvedProviderIds.length) {
    const roomFilter = {
      provider: { $in: approvedProviderIds },
      status: "available",
    };

    if (req.query.guests) {
      roomFilter.capacity = { $gte: Number(req.query.guests) };
    }

    const minPrice = Number.parseFloat(req.query.minPrice);
    const maxPrice = Number.parseFloat(req.query.maxPrice);

    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      roomFilter.basePricePerNight = {};

      if (Number.isFinite(minPrice)) {
        roomFilter.basePricePerNight.$gte = minPrice;
      }

      if (Number.isFinite(maxPrice)) {
        roomFilter.basePricePerNight.$lte = maxPrice;
      }
    }

    if (req.query.bookingMode) {
      roomFilter.bookingMode = req.query.bookingMode;
    }

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
      if (req.query[flag] === "true") {
        roomFilter[`amenities.${flag}`] = true;
      }
    });

    rooms = await Room.find(roomFilter).populate(
      "provider",
      "providerProfile.businessName providerProfile.businessType providerProfile.location providerProfile.checkInTime providerProfile.checkOutTime"
    );
  }

  if (checkIn && checkOut && rooms.length) {
    const roomIds = rooms.map((room) => room._id);
    const bookingOverlap = buildOverlapCondition(checkIn, checkOut, [
      ["checkIn", "checkOut"],
      ["startDate", "endDate"],
      ["from", "to"],
    ]);
    const blockedOverlap = buildOverlapCondition(checkIn, checkOut, [
      ["startDate", "endDate"],
      ["checkIn", "checkOut"],
      ["from", "to"],
    ]);

    const [bookings, blockedDates] = await Promise.all([
      Booking.find({
        room: { $in: roomIds },
        status: { $in: ["confirmed", "pending_confirmation"] },
        ...bookingOverlap,
      }).lean(),
      BlockedDate.find({
        room: { $in: roomIds },
        ...blockedOverlap,
      }).lean(),
    ]);

    const unavailableRoomIds = new Set(
      [...bookings, ...blockedDates].map((item) => item.room?.toString()).filter(Boolean)
    );

    rooms = rooms.filter((room) => !unavailableRoomIds.has(room._id.toString()));
  }

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

  if (!isValidObjectId(providerId)) {
    return next(new AppError("Invalid provider id", 400));
  }

  const provider = await User.findById(providerId).select("providerProfile");
  if (!provider || provider.providerProfile?.verificationStatus !== "approved") {
    return next(new AppError("Provider not approved", 404));
  }

  const rooms = await Room.find({
    provider: provider._id,
    status: "available",
  })
    .populate(
      "provider",
      "providerProfile.businessName providerProfile.businessType providerProfile.location providerProfile.checkInTime providerProfile.checkOutTime"
    )
    .sort("-createdAt");

  const decoratedRooms = rooms.map((room) => decorateStay(room));

  res.status(200).json({
    status: "success",
    data: {
      provider: provider.providerProfile,
      rooms: decoratedRooms,
    },
  });
});
