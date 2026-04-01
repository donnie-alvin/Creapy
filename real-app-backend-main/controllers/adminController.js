const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const emailUtils = require("../utils/email");

const MAX_BULK_REVIVE_IDS = 100;
const objectId = mongoose.Schema.Types.ObjectId;

const getModel = (name, schemaDefinition) => {
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }

  return mongoose.model(
    name,
    new mongoose.Schema(schemaDefinition, {
      timestamps: true,
      strict: false,
    })
  );
};

const Room = getModel("Room", {
  provider: {
    type: objectId,
    ref: "User",
    required: true,
  },
});

const Booking = getModel("Booking", {
  room: {
    type: objectId,
    ref: "Room",
    required: true,
  },
});

const SETTLEMENT_INELIGIBLE_STATUSES = ["cancelled", "canceled", "rejected", "expired"];

// Escape user-provided text before interpolating into regex filters.
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  if (startDate) range.$gte = startDate;
  if (endDate) range.$lte = endDate;

  return range;
}

function normalizeObjectId(value) {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  if (typeof value === "object" && value !== null) {
    if (value._id) {
      return normalizeObjectId(value._id);
    }

    if (typeof value.toString === "function") {
      const stringValue = value.toString();
      if (mongoose.Types.ObjectId.isValid(stringValue)) {
        return new mongoose.Types.ObjectId(stringValue);
      }
    }
  }

  return null;
}

function getRoomProviderId(room) {
  return (
    normalizeObjectId(room?.provider) ||
    normalizeObjectId(room?.providerId) ||
    normalizeObjectId(room?.owner) ||
    normalizeObjectId(room?.user) ||
    normalizeObjectId(room?.providerProfile)
  );
}

function getProviderProfile(userDoc) {
  return userDoc?.providerProfile && typeof userDoc.providerProfile === "object"
    ? userDoc.providerProfile
    : {};
}

async function getProviderRoomStats() {
  const rooms = await Room.find({}, "provider providerId owner user providerProfile").lean();
  const providerIds = new Set();
  const roomCountByProviderId = new Map();

  rooms.forEach((room) => {
    const providerId = getRoomProviderId(room);
    if (!providerId) {
      return;
    }

    const key = providerId.toString();
    providerIds.add(key);
    roomCountByProviderId.set(key, (roomCountByProviderId.get(key) || 0) + 1);
  });

  return {
    providerIds: Array.from(providerIds),
    roomCountByProviderId,
  };
}

function buildProviderResponse(userDoc, roomCount) {
  const providerProfile = getProviderProfile(userDoc);

  return {
    _id: userDoc._id,
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

async function getProviderUserDocument(providerId) {
  return User.collection.findOne({ _id: normalizeObjectId(providerId) });
}

exports.getInactiveListings = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  let userIds;
  const landlordRaw = req.query.landlord ? String(req.query.landlord).trim() : "";
  const landlord = landlordRaw ? escapeRegex(landlordRaw) : "";

  if (landlord) {
    const users = await User.find(
      {
        $or: [
          { username: new RegExp(landlord, "i") },
          { email: new RegExp(landlord, "i") },
        ],
      },
      "_id"
    );

    userIds = users.map((user) => user._id);

    if (!userIds.length) {
      return res.status(200).json({
        status: "success",
        total: 0,
        results: 0,
        data: [],
      });
    }
  }

  const filter = { status: "inactive" };
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
    filter["location.province"] = new RegExp(escapeRegex(province), "i");
  }

  const city = cityRaw ? String(cityRaw).trim() : "";
  if (city) {
    filter["location.city"] = new RegExp(escapeRegex(city), "i");
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
    filter.paymentDeadline = paymentDeadlineRange;
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
    filter.createdAt = createdAtRange;
  }

  if (userIds) {
    filter.user = { $in: userIds };
  }

  const total = await Listing.countDocuments(filter);
  const listings = await Listing.find(filter)
    .populate("user", "username email")
    .skip(skip)
    .limit(limit)
    .sort({ paymentDeadline: 1 });

  res.status(200).json({
    status: "success",
    total,
    results: listings.length,
    data: listings,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      failed.push({ id, reason: "Listing not found" });
      continue;
    }

    const listing = await Listing.findById(id).populate("user", "username email");

    if (!listing) {
      failed.push({ id, reason: "Listing not found" });
      continue;
    }

    if (listing.status !== "inactive") {
      failed.push({ id, reason: "Listing is not inactive" });
      continue;
    }

    const activeCount = await Listing.countDocuments({
      user: listing.user._id,
      status: { $ne: "inactive" },
      _id: { $ne: listing._id },
    });

    if (activeCount >= 1) {
      failed.push({ id, reason: "Landlord already has an active listing" });
      continue;
    }

    listing.status = "active";
    listing.publishedAt = new Date();
    listing.paymentDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await listing.save();

    revived.push(id);

    if (listing.user?.email) {
      emailUtils.sendEmail({
        to: listing.user.email,
        subject: "Your listing has been revived",
        text: `Your listing '${listing.name}' has been revived by an admin and is now active. You have 48 hours to complete payment to keep it live.`,
      }).catch((error) => {
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
  const search = searchRaw ? escapeRegex(searchRaw) : "";

  const { providerIds, roomCountByProviderId } = await getProviderRoomStats();
  const rawUsers = await User.collection
    .find({
      $or: [
        { _id: { $in: providerIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { providerProfile: { $exists: true } },
      ],
    })
    .toArray();

  const filteredProviders = rawUsers
    .map((userDoc) => buildProviderResponse(userDoc, roomCountByProviderId.get(String(userDoc._id)) || 0))
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
        .join(" ");

      return new RegExp(search, "i").test(haystack);
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
  const providerId = normalizeObjectId(req.params.id);
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

  const provider = await getProviderUserDocument(providerId);
  if (!provider) {
    return next(new AppError("Provider not found", 404));
  }

  const providerProfile = getProviderProfile(provider);
  const updatedProviderProfile = {
    ...providerProfile,
    verificationStatus,
    verifiedAt: verificationStatus === "approved" ? new Date() : null,
    verificationNotes: req.body.verificationNotes || providerProfile.verificationNotes || null,
  };

  await User.collection.updateOne(
    { _id: providerId },
    { $set: { providerProfile: updatedProviderProfile } }
  );

  res.status(200).json({
    status: "success",
    data: buildProviderResponse(
      {
        ...provider,
        providerProfile: updatedProviderProfile,
      },
      0
    ),
  });
});

exports.updateProviderCommission = catchAsync(async (req, res, next) => {
  const providerId = normalizeObjectId(req.params.id);
  const commissionRate = Number(req.body.commissionRate);

  if (!providerId) {
    return next(new AppError("Invalid provider id", 400));
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0) {
    return next(new AppError("commissionRate must be a non-negative number", 400));
  }

  const provider = await getProviderUserDocument(providerId);
  if (!provider) {
    return next(new AppError("Provider not found", 404));
  }

  const providerProfile = getProviderProfile(provider);
  const updatedProviderProfile = {
    ...providerProfile,
    commissionRate,
  };

  await User.collection.updateOne(
    { _id: providerId },
    { $set: { providerProfile: updatedProviderProfile } }
  );

  res.status(200).json({
    status: "success",
    data: buildProviderResponse(
      {
        ...provider,
        providerProfile: updatedProviderProfile,
      },
      0
    ),
  });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const status = req.query.status ? String(req.query.status).trim() : "";
  const providerId = normalizeObjectId(req.query.provider);
  const settlementStatus = req.query.settlementStatus
    ? String(req.query.settlementStatus).trim().toLowerCase()
    : "";
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;

  if (req.query.provider && !providerId) {
    return next(new AppError("Invalid provider filter", 400));
  }

  if (dateFrom && Number.isNaN(dateFrom.getTime())) {
    return next(new AppError("Invalid dateFrom", 400));
  }

  if (dateTo && Number.isNaN(dateTo.getTime())) {
    return next(new AppError("Invalid dateTo", 400));
  }

  const bookingQuery = {};

  if (status) {
    bookingQuery.status = status;
  }

  if (dateFrom || dateTo) {
    bookingQuery.createdAt = {};
    if (dateFrom) bookingQuery.createdAt.$gte = dateFrom;
    if (dateTo) bookingQuery.createdAt.$lte = dateTo;
  }

  if (settlementStatus === "settled") {
    bookingQuery.$or = [{ settlementStatus: "settled" }, { settledAt: { $ne: null } }];
  } else if (settlementStatus === "pending") {
    bookingQuery.$and = [
      {
        $or: [{ settlementStatus: { $exists: false } }, { settlementStatus: { $ne: "settled" } }],
      },
      {
        $or: [{ settledAt: { $exists: false } }, { settledAt: null }],
      },
    ];
  }

  if (providerId) {
    const providerRooms = await Room.find(
      {
        $or: [
          { provider: providerId },
          { providerId },
          { owner: providerId },
          { user: providerId },
          { providerProfile: providerId },
        ],
      },
      "_id"
    ).lean();

    bookingQuery.room = { $in: providerRooms.map((room) => room._id) };
  }

  const bookings = await Booking.find(bookingQuery).sort("-createdAt").lean();
  const roomIds = bookings
    .map((booking) => normalizeObjectId(booking.room))
    .filter(Boolean);
  const rooms = roomIds.length
    ? await Room.find({ _id: { $in: roomIds } }).lean()
    : [];
  const roomsById = new Map(rooms.map((room) => [String(room._id), room]));
  const bookingProviderIds = Array.from(
    new Set(
      rooms
        .map((room) => getRoomProviderId(room))
        .filter(Boolean)
        .map((id) => id.toString())
    )
  );
  const providers = bookingProviderIds.length
    ? await User.collection
        .find({ _id: { $in: bookingProviderIds.map((id) => new mongoose.Types.ObjectId(id)) } })
        .toArray()
    : [];
  const providersById = new Map(providers.map((provider) => [String(provider._id), provider]));

  const data = bookings.map((booking) => {
    const room = roomsById.get(String(booking.room)) || null;
    const provider = room ? providersById.get(String(getRoomProviderId(room))) || null : null;
    const isSettled = booking.settlementStatus === "settled" || Boolean(booking.settledAt);

    return {
      ...booking,
      settlementStatus: isSettled ? "settled" : "pending",
      room: room
        ? {
            _id: room._id,
            name: room.name || room.title || room.roomName || "Room",
            location: room.location || null,
          }
        : null,
      provider: provider
        ? {
            _id: provider._id,
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid booking id", 400));
  }

  const booking = await Booking.findById(req.params.id);
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

  booking.settlementStatus = "settled";
  booking.settledAt = new Date();
  booking.settlementReference = req.body.settlementReference || booking.settlementReference || null;
  await booking.save();

  res.status(200).json({
    status: "success",
    data: booking,
  });
});
