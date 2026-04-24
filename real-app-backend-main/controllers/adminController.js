const catchAsync = require("../utils/catchAsync");
const prisma = require("../utils/prisma");
const AppError = require("../utils/appError");
const emailUtils = require("../utils/email");

const MAX_BULK_REVIVE_IDS = 100;
const SETTLEMENT_INELIGIBLE_STATUSES = ["cancelled", "canceled", "rejected", "expired"];

function parseDateRange(startValue, endValue, startLabel, endLabel, next) {
  if (!startValue && !endValue) {
    return null;
  }

  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;

  if (startValue && Number.isNaN(startDate.getTime())) {
    next(new AppError(`Invalid ${startLabel} date format`, 400));
    return null;
  }

  if (endValue && Number.isNaN(endDate.getTime())) {
    next(new AppError(`Invalid ${endLabel} date format`, 400));
    return null;
  }

  if (startDate && endDate && startDate > endDate) {
    next(new AppError(`${startLabel} cannot be after ${endLabel}`, 400));
    return null;
  }

  const range = {};
  if (startDate) range.gte = startDate;
  if (endDate) range.lte = endDate;

  return range;
}

function getProviderProfile(userDoc) {
  return userDoc?.providerProfile && typeof userDoc.providerProfile === "object"
    ? userDoc.providerProfile
    : {};
}

function buildProviderResponse(userDoc, roomCount) {
  const providerProfile = getProviderProfile(userDoc);

  return {
    _id: userDoc.id,
    username: userDoc.username || "Unknown provider",
    email: userDoc.email || null,
    phoneNumber: userDoc.phoneNumber || null,
    role: userDoc.role || null,
    roomCount,
    createdAt: userDoc.createdAt || null,
    providerProfile: {
      verificationStatus: providerProfile.verificationStatus || "pending",
      commissionRate:
        typeof providerProfile.commissionRate === "number"
          ? providerProfile.commissionRate
          : 0,
      verifiedAt: providerProfile.verifiedAt || null,
      verificationNotes: providerProfile.verificationNotes || null,
    },
  };
}

exports.getInactiveListings = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  let userIds;
  const landlordRaw = req.query.landlord ? String(req.query.landlord).trim() : "";

  if (landlordRaw) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: landlordRaw, mode: "insensitive" } },
          { email: { contains: landlordRaw, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    userIds = users.map((user) => user.id);

    if (!userIds.length) {
      return res.status(200).json({
        status: "success",
        total: 0,
        results: 0,
        data: [],
      });
    }
  }

  const where = { status: "inactive" };
  const {
    province: provinceRaw,
    city: cityRaw,
    expiredFrom,
    expiredTo,
    uploadedFrom,
    uploadedTo,
  } = req.query;

  const province = provinceRaw ? String(provinceRaw).trim() : "";
  if (province) {
    where.province = { contains: province, mode: "insensitive" };
  }

  const city = cityRaw ? String(cityRaw).trim() : "";
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  const paymentDeadlineRange = parseDateRange(
    expiredFrom,
    expiredTo,
    "expiredFrom",
    "expiredTo",
    next
  );
  if (paymentDeadlineRange === null && (expiredFrom || expiredTo)) {
    return;
  }
  if (paymentDeadlineRange) {
    where.paymentDeadline = paymentDeadlineRange;
  }

  const createdAtRange = parseDateRange(
    uploadedFrom,
    uploadedTo,
    "uploadedFrom",
    "uploadedTo",
    next
  );
  if (createdAtRange === null && (uploadedFrom || uploadedTo)) {
    return;
  }
  if (createdAtRange) {
    where.createdAt = createdAtRange;
  }

  if (userIds) {
    where.userId = { in: userIds };
  }

  const total = await prisma.listing.count({ where });
  const listings = await prisma.listing.findMany({
    where,
    skip,
    take: limit,
    orderBy: { paymentDeadline: "asc" },
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    total,
    results: listings.length,
    data: listings.map((listing) => ({
      ...listing,
      _id: listing.id,
      user: listing.user,
    })),
  });
});

exports.bulkReviveListings = catchAsync(async (req, res, next) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || !ids.length) {
    return next(new AppError("ids must be a non-empty array", 400));
  }
  if (ids.length > MAX_BULK_REVIVE_IDS) {
    return next(new AppError("Cannot revive more than 100 listings at once", 400));
  }

  const normalizedIds = ids.map((value) =>
    typeof value === "string" ? value.trim() : String(value)
  );
  const revived = [];
  const failed = [];

  for (const id of normalizedIds) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      failed.push({ id, reason: "Listing not found" });
      continue;
    }

    if (listing.status !== "inactive") {
      failed.push({ id, reason: "Listing is not inactive" });
      continue;
    }

    const activeCount = await prisma.listing.count({
      where: {
        userId: listing.userId,
        status: { not: "inactive" },
        id: { not: listing.id },
      },
    });

    if (activeCount >= 1) {
      failed.push({ id, reason: "Landlord already has an active listing" });
      continue;
    }

    await prisma.listing.update({
      where: { id },
      data: {
        status: "active",
        publishedAt: new Date(),
        paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    revived.push(id);

    if (listing.user?.email) {
      emailUtils
        .sendEmail({
          to: listing.user.email,
          subject: "Your listing has been revived",
          text: `Your listing '${listing.name}' has been revived by an admin and is now active. You have 48 hours to complete payment to keep it live.`,
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.log("[admin-revive-email]", error?.message || error);
        });
    }
  }

  res.status(200).json({
    status: "success",
    revived,
    failed,
  });
});

exports.getProviders = catchAsync(async (req, res) => {
  const verificationStatusRaw = req.query.verificationStatus
    ? String(req.query.verificationStatus).trim().toLowerCase()
    : "";
  const searchRaw = req.query.search ? String(req.query.search).trim() : "";
  const search = searchRaw.toLowerCase();

  const roomStats = await prisma.room.groupBy({
    by: ["providerId"],
    _count: { id: true },
  });
  const roomCountByProviderId = new Map(
    roomStats.map((item) => [item.providerId, item._count.id])
  );
  const providerIds = roomStats.map((item) => item.providerId);

  const rawUsers = await prisma.user.findMany({
    where: {
      OR: [{ id: { in: providerIds } }, { providerProfile: { not: null } }],
    },
  });

  const filteredProviders = rawUsers
    .map((userDoc) => buildProviderResponse(userDoc, roomCountByProviderId.get(userDoc.id) || 0))
    .filter((provider) => {
      if (
        verificationStatusRaw &&
        provider.providerProfile.verificationStatus.toLowerCase() !== verificationStatusRaw
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [provider.username, provider.email, provider.phoneNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    })
    .sort((left, right) => {
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightDate - leftDate;
    });

  res.status(200).json({
    status: "success",
    total: filteredProviders.length,
    results: filteredProviders.length,
    data: filteredProviders,
  });
});

exports.verifyProvider = catchAsync(async (req, res, next) => {
  const providerId = req.params.id;
  const verificationStatus = (req.body.verificationStatus || req.body.status || "")
    .toString()
    .trim()
    .toLowerCase();

  if (!providerId) {
    return next(new AppError("Invalid provider id", 400));
  }

  if (!["approved", "rejected", "pending"].includes(verificationStatus)) {
    return next(new AppError("verificationStatus must be approved, rejected, or pending", 400));
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
  });
  if (!provider) {
    return next(new AppError("Provider not found", 404));
  }

  const merged = {
    ...(provider.providerProfile || {}),
    verificationStatus,
    verifiedAt: verificationStatus === "approved" ? new Date() : null,
    verificationNotes: req.body.verificationNotes || provider.providerProfile?.verificationNotes || null,
  };

  const updatedProvider = await prisma.user.update({
    where: { id: providerId },
    data: { providerProfile: merged },
  });

  res.status(200).json({
    status: "success",
    data: buildProviderResponse(updatedProvider, 0),
  });
});

exports.updateProviderCommission = catchAsync(async (req, res, next) => {
  const providerId = req.params.id;
  const commissionRate = Number(req.body.commissionRate);

  if (!providerId) {
    return next(new AppError("Invalid provider id", 400));
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0) {
    return next(new AppError("commissionRate must be a non-negative number", 400));
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
  });
  if (!provider) {
    return next(new AppError("Provider not found", 404));
  }

  const updatedProvider = await prisma.user.update({
    where: { id: providerId },
    data: {
      providerProfile: {
        ...(provider.providerProfile || {}),
        commissionRate,
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: buildProviderResponse(updatedProvider, 0),
  });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const status = req.query.status ? String(req.query.status).trim() : "";
  const providerId = req.query.provider ? String(req.query.provider) : "";
  const settlementStatus = req.query.settlementStatus
    ? String(req.query.settlementStatus).trim().toLowerCase()
    : "";
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

  if (req.query.provider && !providerId.trim()) {
    return next(new AppError("Invalid provider filter", 400));
  }

  if (dateFrom && Number.isNaN(dateFrom.getTime())) {
    return next(new AppError("Invalid dateFrom", 400));
  }

  if (dateTo && Number.isNaN(dateTo.getTime())) {
    return next(new AppError("Invalid dateTo", 400));
  }

  const where = {};

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  if (settlementStatus === "settled") {
    where.OR = [{ settlementStatus: "settled" }, { settledAt: { not: null } }];
  } else if (settlementStatus === "pending") {
    where.AND = [{ settlementStatus: { not: "settled" } }, { settledAt: null }];
  }

  if (providerId.trim()) {
    const providerRooms = await prisma.room.findMany({
      where: { providerId: providerId.trim() },
      select: { id: true },
    });
    where.roomId = { in: providerRooms.map((room) => room.id) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  const roomIds = Array.from(new Set(bookings.map((booking) => booking.roomId).filter(Boolean)));
  const rooms = roomIds.length
    ? await prisma.room.findMany({
        where: { id: { in: roomIds } },
      })
    : [];
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const bookingProviderIds = Array.from(
    new Set(rooms.map((room) => room.providerId).filter(Boolean))
  );
  const providers = bookingProviderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: bookingProviderIds } },
      })
    : [];
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));

  const data = bookings.map((booking) => {
    const room = roomsById.get(booking.roomId) || null;
    const provider = room ? providersById.get(room.providerId) || null : null;
    const isSettled = booking.settlementStatus === "settled" || Boolean(booking.settledAt);

    return {
      ...booking,
      _id: booking.id,
      settlementStatus: isSettled ? "settled" : "pending",
      room: room
        ? {
            ...room,
            _id: room.id,
            name: room.name || room.title || room.roomName || "Room",
            location: room.location || null,
          }
        : null,
      provider: provider
        ? {
            _id: provider.id,
            username: provider.username || "Unknown provider",
            email: provider.email || null,
          }
        : null,
    };
  });

  res.status(200).json({
    status: "success",
    total: data.length,
    results: data.length,
    data,
  });
});

exports.settleBooking = catchAsync(async (req, res, next) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  if (
    booking.settlementStatus === "settled" ||
    booking.settledAt ||
    SETTLEMENT_INELIGIBLE_STATUSES.includes(String(booking.status || "").toLowerCase())
  ) {
    return next(new AppError("Booking is not eligible for settlement", 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      settlementStatus: "settled",
      settledAt: new Date(),
      settlementReference:
        req.body.settlementReference || booking.settlementReference || null,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      ...updatedBooking,
      _id: updatedBooking.id,
    },
  });
});
