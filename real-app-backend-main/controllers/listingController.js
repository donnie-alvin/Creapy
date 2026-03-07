// Custom Imports
const catchAsync = require("../utils/catchAsync");
const Listing = require("../models/listingModel");
const AppError = require("../utils/appError");
const SavedSearch = require("../models/savedSearchModel");
const User = require("../models/userModel");
const { sendEmail } = require("../utils/email");
const mongoose = require("mongoose");
const { isPremiumTenant } = require("../utils/monetization");
const SINGLE_ACTIVE_LISTING_MESSAGE =
  "You already have an active listing. You can only have one listing at a time.";

const isDuplicateKeyError = (error) =>
  error &&
  error.code === 11000 &&
  ((error.keyPattern && error.keyPattern.user) ||
    (error.keyValue && error.keyValue.user));

const applyListingLifecycle = async () => {
  const now = new Date();

  // 1) Promote expired early_access listings to active
  await Listing.updateMany(
    {
      status: "early_access",
      earlyAccessUntil: { $lt: now },
    },
    {
      $set: { status: "active" },
    }
  );

  // 2) Demote overdue active/pending_payment listings to inactive
  await Listing.updateMany(
    {
      paymentDeadline: { $lt: now },
      status: { $in: ["active", "pending_payment"] },
    },
    {
      $set: { status: "inactive" },
    }
  );

  // 3) Demote active listings to pending_payment after 24h window
  await Listing.updateMany(
    {
      publishedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      paymentDeadline: { $gt: now },
      status: "active",
    },
    {
      $set: { status: "pending_payment" },
    }
  );
};

const normalizeListingPayload = (body) => {
  // Backwards compat: frontend may send regularPrice/discountedPrice.
  const payload = { ...body };
  if (payload.regularPrice != null && payload.monthlyRent == null) {
    payload.monthlyRent = payload.regularPrice;
  }

  // Source-of-truth for parking is amenities.parking.
  // Backwards compat: older UI may send parking as a top-level boolean.
  if (payload.parking != null) {
    payload.amenities = payload.amenities || {};
    if (payload.amenities.parking == null) {
      payload.amenities.parking = payload.parking;
    }
    delete payload.parking;
  }

  // Do not persist discountedPrice if not needed; keep if present.
  return payload;
};

const matchesSavedSearch = (search, listing) => {
  const c = search.criteria || {};
  const loc = (c.location || "").trim().toLowerCase();
  if (loc) {
    const listingLoc = (listing.location || "").toLowerCase();
    if (!listingLoc.includes(loc)) return false;
  }

  const rent = Number(listing.monthlyRent || 0);
  const minRent = Number(c.minRent || 0);
  const maxRent = Number(c.maxRent || 0);
  if (minRent && rent < minRent) return false;
  if (maxRent && rent > maxRent) return false;

  const beds = Number(listing.bedrooms || 0);
  const minBeds = Number(c.minBedrooms || 0);
  if (minBeds && beds < minBeds) return false;

  const rooms = Number(listing.totalRooms || 0);
  const minRooms = Number(c.minTotalRooms || 0);
  if (minRooms && rooms < minRooms) return false;

  const wantedAmenities = (c.amenities || {});
  const listingAmenities = listing.amenities || {};
  for (const key of Object.keys(wantedAmenities)) {
    if (wantedAmenities[key] === true && listingAmenities[key] !== true) {
      return false;
    }
  }
  return true;
};

exports.createListing = catchAsync(async (req, res, next) => {
  // 1) Create a listing
  const existingCount = await Listing.countDocuments({
    user: req.user.id,
    status: { $ne: "inactive" },
  });
  if (existingCount >= 1) {
    return res.status(400).json({
      message: SINGLE_ACTIVE_LISTING_MESSAGE,
    });
  }

  const payload = normalizeListingPayload(req.body);
  payload.user = req.user.id;
  payload.status = "active";
  payload.publishedAt = new Date();
  payload.paymentDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
  let newListing;
  try {
    newListing = await Listing.create(payload);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(400).json({
        message: SINGLE_ACTIVE_LISTING_MESSAGE,
      });
    }
    throw error;
  }

  // 1b) Trigger saved-search alerts (email) for tenants
  try {
    const activeSearches = await SavedSearch.find({ isActive: true }).populate(
      "user",
      "email role"
    );
    const matches = activeSearches.filter(
      (s) => s.user && s.user.role === "tenant" && matchesSavedSearch(s, newListing)
    );
    // Fire-and-forget style (but awaited in try for simplicity)
    for (const s of matches) {
      const to = s.user.email;
      await sendEmail({
        to,
        subject: "New property matching your saved search",
        text: `A new property was listed in ${newListing.location} for ${newListing.monthlyRent}. Open the app to view details.`,
      });
      s.lastNotifiedAt = new Date();
      await s.save({ validateBeforeSave: false });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("[saved-search-alerts]", e?.message || e);
  }

  // 2) Send the response
  res.status(201).json({
    status: "success",
    data: {
      listing: newListing,
    },
  });
});

exports.getUsersListings = catchAsync(async (req, res, next) => {
  // 1) Find all listings based on user id
  const listings = await Listing.find({ user: req.params.id });

  // 2) Send the response
  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings,
  });
});

exports.getListing = catchAsync(async (req, res, next) => {
  // 1) Find the listing
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid listing id", 400));
  }
  const listing = await Listing.findById(req.params.id);

  // 2) Check if the listing exists
  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  // 3) Owners can always view their own listing (including pending_payment/early_access)
  if (req.user && listing.user.toString() === req.user.id) {
    return res.status(200).json({
      status: "success",
      data: listing,
    });
  }

  // 4) Check visibility: conceal pending_payment and early_access (unless premium)
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  if (listing.status === "pending_payment") {
    return next(new AppError("No listing found with that ID", 404));
  }
  if (listing.status === "early_access" && !isPremium) {
    return next(new AppError("No listing found with that ID", 404));
  }

  // 5) Send the response
  res.status(200).json({
    status: "success",
    data: listing,
  });
});

exports.deleteListing = catchAsync(async (req, res, next) => {
  // 1) Find the listing
  const listing = await Listing.findById(req.params.id);

  // 2) Check if the listing exists
  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  // 3) Check if the user owns the listing
  if (listing.user.toString() !== req.user.id) {
    return next(new AppError("You do not own this listing", 403));
  }

  // 4) Delete the listing
  await Listing.findByIdAndDelete(req.params.id);

  // 4) Send the response
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateListing = catchAsync(async (req, res, next) => {
  // 1) Find the listing
  const listing = await Listing.findById(req.params.id);

  // 2) Check if the listing exists
  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  // 3) Check if the user owns the listing
  if (listing.user.toString() !== req.user.id) {
    return next(new AppError("You do not own this listing", 403));
  }

  const lifecycleControlledFields = [
    "status",
    "paymentDeadline",
    "publishedAt",
    "earlyAccessUntil",
  ];
  const attemptedLifecycleFields = lifecycleControlledFields.filter(
    (field) => Object.prototype.hasOwnProperty.call(req.body, field)
  );
  if (attemptedLifecycleFields.length > 0) {
    return next(
      new AppError(
        "Listing lifecycle fields cannot be updated from this endpoint.",
        400
      )
    );
  }

  // 4) Update the listing
  const updatedListing = await Listing.findByIdAndUpdate(
    req.params.id,
    normalizeListingPayload(req.body),
    {
      new: true,
      runValidators: true,
    }
  );

  // 5) Send the response
  res.status(200).json({
    status: "success",
    data: updatedListing,
  });
});

exports.getListings = catchAsync(async (req, res, next) => {
  // 0) Apply listing lifecycle updates
  await applyListingLifecycle();

  // 1) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 6;
  const skip = (page - 1) * limit;

  // 2) Sorting
  // i) regularPrice_asc
  // ii) regularPrice_desc
  // iii) createdAt_desc
  // iv) createdAt_asc
  let sort = {};
  if (req.query.sort) {
    const sortQuery = req.query.sort.split("_");
    // Backwards compat: UI may request regularPrice sorting.
    if (sortQuery[0] === "regularPrice") sortQuery[0] = "monthlyRent";
    if (sortQuery[1] === "desc") {
      sort[sortQuery[0]] = -1;
    } else {
      sort[sortQuery[0]] = 1;
    }
  } else {
    sort = { createdAt: 1 };
  }

  // 3) Base filter: determine premium status and set status filter accordingly
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const filter = {
    status: isPremium ? { $in: ["active", "early_access"] } : "active",
  };

  // 3a) Text search (name/description)
  const searchTerm = (req.query.searchTerm || "").toString().trim();
  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");
    filter.$or = [{ name: regex }, { description: regex }];
  }

  // 3b) Location/area search
  const location = (req.query.location || "").toString().trim();
  if (location) {
    filter.location = new RegExp(location, "i");
  }

  // 3c) Price range (monthlyRent)
  const minRent = Number(req.query.minRent || 0);
  const maxRent = Number(req.query.maxRent || 0);
  if (minRent || maxRent) {
    filter.monthlyRent = {};
    if (minRent) filter.monthlyRent.$gte = minRent;
    if (maxRent) filter.monthlyRent.$lte = maxRent;
  }

  // 3d) Minimum bedrooms
  const minBedrooms = Number(req.query.minBedrooms || 0);
  if (minBedrooms) {
    filter.bedrooms = { $gte: minBedrooms };
  }

  const minTotalRooms = Number(req.query.minTotalRooms || 0);
  if (minTotalRooms) {
    filter.totalRooms = { $gte: minTotalRooms };
  }

  // 3e) Amenities (solar, borehole, security, parking, internet)
  const amenityKeys = ["solar", "borehole", "security", "parking", "internet"];
  for (const key of amenityKeys) {
    if (req.query[key] === "true") {
      filter[`amenities.${key}`] = true;
    }
  }

  // 4) Find all listings based on type "all" or "sale" or "rent"
  if (req.query.type && req.query.type !== "all") {
    filter.type = req.query.type;
  }

  // 5) Find all listings based on furnished true or false
  if (req.query.furnished) {
    if (req.query.furnished === "false") {
      filter.furnished = { $in: [true, false] };
    } else {
      filter.furnished = req.query.furnished;
    }
  }

  // 6) Find all listings based on offer true or false
  if (req.query.offer) {
    if (req.query.offer === "false") {
      filter.offer = { $in: [true, false] };
    } else {
      filter.offer = req.query.offer;
    }
  }

  // 4) Find all listings
  const listings = await Listing.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  // 5) Send the response
  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings,
  });
});

exports.getHomeHighlighted = catchAsync(async (req, res, next) => {
  // 0) Apply listing lifecycle updates
  await applyListingLifecycle();

  const limit = Math.max(1, Number(req.query.limit) || 9);
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const statusFilter = isPremium ? { $in: ["active", "early_access"] } : "active";

  const listings = await Listing.find({ status: statusFilter })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings,
  });
});

exports.getHomeGroupedByLocation = catchAsync(async (req, res, next) => {
  // 0) Apply listing lifecycle updates
  await applyListingLifecycle();

  const locationsLimit = Math.max(1, Number(req.query.locationsLimit) || 6);
  const perLocation = Math.max(1, Number(req.query.perLocation) || 6);
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const statusFilter = isPremium ? { $in: ["active", "early_access"] } : "active";

  // Group active listings by a normalized location key (trim + lower-case),
  // then sort listings/groups by recency for the home location slider.
  const grouped = await Listing.aggregate([
    {
      $match: {
        status: statusFilter,
        location: { $exists: true, $type: "string", $ne: "" },
      },
    },
    {
      $addFields: {
        _locationTrimmed: { $trim: { input: "$location" } },
      },
    },
    {
      $match: {
        _locationTrimmed: { $ne: "" },
      },
    },
    {
      $addFields: {
        _normalizedLocation: { $toLower: "$_locationTrimmed" },
        _fallbackImage: {
          $ifNull: [
            "$image",
            {
              $ifNull: [
                { $arrayElemAt: ["$images", 0] },
                { $ifNull: [{ $arrayElemAt: ["$imageUrls", 0] }, null] },
              ],
            },
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$_normalizedLocation",
        location: { $first: "$_locationTrimmed" },
        mostRecentListing: { $first: "$createdAt" },
        listings: {
          $push: {
            _id: "$_id",
            name: "$name",
            location: "$_locationTrimmed",
            monthlyRent: "$monthlyRent",
            bedrooms: "$bedrooms",
            totalRooms: "$totalRooms",
            amenities: "$amenities",
            image: "$_fallbackImage",
            images: { $ifNull: ["$images", "$imageUrls"] },
            createdAt: "$createdAt",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        location: 1,
        mostRecentListing: 1,
        listings: { $slice: ["$listings", perLocation] },
      },
    },
    { $sort: { mostRecentListing: -1 } },
    { $limit: locationsLimit },
    {
      $project: {
        location: 1,
        listings: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: grouped.length,
    data: grouped,
  });
});
