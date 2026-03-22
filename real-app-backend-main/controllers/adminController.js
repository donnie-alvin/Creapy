const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const emailUtils = require("../utils/email");

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
