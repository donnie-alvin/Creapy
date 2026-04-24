// Custom Imports
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");
const { sendEmail } = require("../utils/email");
const { isPremiumTenant } = require("../utils/monetization");

const SINGLE_ACTIVE_LISTING_MESSAGE =
  "You already have an active listing. You can only have one listing at a time.";

const mapLegacyLocation = (listing) => ({
  province: listing?.province || "",
  city: listing?.city || "",
  addressLine: listing?.addressLine || "",
  country: "Zimbabwe",
});

const mapListingId = (listing) =>
  listing
    ? {
        ...listing,
        _id: listing.id,
        location: mapLegacyLocation(listing),
      }
    : listing;

const mapListingWithUser = (listing) =>
  listing
    ? {
        ...mapListingId(listing),
        user: listing.userId,
      }
    : listing;

const getListingImage = (imageUrls) => {
  if (Array.isArray(imageUrls)) {
    return imageUrls[0] || null;
  }

  if (typeof imageUrls === "string") {
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed[0] || null : null;
    } catch (error) {
      return null;
    }
  }

  return null;
};

const getNormalizedProvinceValue = (listing) => listing?.province || "";

const applyListingLifecycle = async () => {
  const now = new Date();

  await prisma.listing.updateMany({
    where: {
      status: "early_access",
      earlyAccessUntil: { lt: now },
    },
    data: { status: "active" },
  });

  await prisma.listing.updateMany({
    where: {
      paymentDeadline: { lt: now },
      status: { in: ["active", "pending_payment"] },
    },
    data: { status: "inactive" },
  });

  await prisma.listing.updateMany({
    where: {
      publishedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      paymentDeadline: { gt: now },
      status: "active",
    },
    data: { status: "pending_payment" },
  });
};

const normalizeListingPayload = (body) => {
  const payload = { ...body };
  if (payload.regularPrice != null && payload.monthlyRent == null) {
    payload.monthlyRent = payload.regularPrice;
  }

  if (payload.parking != null) {
    payload.amenities = payload.amenities || {};
    if (payload.amenities.parking == null) {
      payload.amenities.parking = payload.parking;
    }
    delete payload.parking;
  }

  if (typeof payload.location === "string") {
    payload.location = {
      province: payload.location,
      country: "Zimbabwe",
      addressLine: payload.address || "",
      city: "",
    };
  } else if (payload.location && typeof payload.location === "object") {
    payload.location = {
      addressLine: payload.location.addressLine || payload.address || "",
      country: payload.location.country || "Zimbabwe",
      province: payload.location.province || "",
      city: payload.location.city || "",
      coordinates: payload.location.coordinates || {
        lat: null,
        lng: null,
      },
    };
  }

  const location = payload.location || {};
  payload.province = location.province || "";
  payload.city = location.city || "";
  payload.addressLine = location.addressLine || "";
  payload.lat = location.coordinates?.lat ?? null;
  payload.lng = location.coordinates?.lng ?? null;
  delete payload.location;

  return payload;
};

const matchesSavedSearch = (search, listing) => {
  const c = search.criteria || {};
  const loc = (c.location || "").trim().toLowerCase();
  if (loc) {
    const listingLocs = [];
    if (listing.province) {
      listingLocs.push(listing.province.toLowerCase());
    }
    if (listing.city) {
      listingLocs.push(listing.city.toLowerCase());
    }
    if (listing.addressLine) {
      listingLocs.push(listing.addressLine.toLowerCase());
    }
    const locationMatches = listingLocs.some((value) => value.includes(loc));
    if (!locationMatches) return false;
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

  const wantedAmenities = c.amenities || {};
  const listingAmenities = listing.amenities || {};
  for (const key of Object.keys(wantedAmenities)) {
    if (wantedAmenities[key] === true && listingAmenities[key] !== true) {
      return false;
    }
  }
  return true;
};

exports.createListing = catchAsync(async (req, res, next) => {
  const existingCount = await prisma.listing.count({
    where: {
      userId: req.user.id,
      status: { not: "inactive" },
    },
  });
  if (existingCount >= 1) {
    return res.status(400).json({
      message: SINGLE_ACTIVE_LISTING_MESSAGE,
    });
  }

  const data = {
    ...normalizeListingPayload(req.body),
    userId: req.user.id,
    status: "active",
    publishedAt: new Date(),
    paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
  };

  let newListing;
  try {
    newListing = await prisma.listing.create({ data });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        message: SINGLE_ACTIVE_LISTING_MESSAGE,
      });
    }
    throw error;
  }

  try {
    const activeSearches = await prisma.savedSearch.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
    const matches = activeSearches.filter(
      (s) => s.user && s.user.role === "tenant" && matchesSavedSearch(s, newListing)
    );
    for (const s of matches) {
      await sendEmail({
        to: s.user.email,
        subject: "New property matching your saved search",
        text: `A new property was listed in ${getNormalizedProvinceValue(
          newListing
        )} for ${newListing.monthlyRent}. Open the app to view details.`,
      });
      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastNotifiedAt: new Date() },
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("[saved-search-alerts]", e?.message || e);
  }

  res.status(201).json({
    status: "success",
    data: {
      listing: mapListingWithUser(newListing),
    },
  });
});

exports.getUsersListings = catchAsync(async (req, res, next) => {
  const listings = await prisma.listing.findMany({
    where: { userId: req.params.id },
  });

  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings.map(mapListingId),
  });
});

exports.getListing = catchAsync(async (req, res, next) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });

  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  if (req.user && listing.userId === req.user.id) {
    return res.status(200).json({
      status: "success",
      data: mapListingId(listing),
    });
  }

  if (listing.status === "pending_payment") {
    return next(new AppError("No listing found with that ID", 404));
  }

  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  if (listing.status === "early_access" && !isPremium) {
    return next(new AppError("No listing found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: mapListingId(listing),
  });
});

exports.deleteListing = catchAsync(async (req, res, next) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });

  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  if (listing.userId !== req.user.id) {
    return next(new AppError("You do not own this listing", 403));
  }

  await prisma.listing.delete({
    where: { id: req.params.id },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateListing = catchAsync(async (req, res, next) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });

  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  if (listing.userId !== req.user.id) {
    return next(new AppError("You do not own this listing", 403));
  }

  const lifecycleControlledFields = [
    "status",
    "paymentDeadline",
    "publishedAt",
    "earlyAccessUntil",
  ];
  const attemptedLifecycleFields = lifecycleControlledFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(req.body, field)
  );
  if (attemptedLifecycleFields.length > 0) {
    return next(
      new AppError(
        "Listing lifecycle fields cannot be updated from this endpoint.",
        400
      )
    );
  }

  const updatedListing = await prisma.listing.update({
    where: { id: req.params.id },
    data: normalizeListingPayload(req.body),
  });

  res.status(200).json({
    status: "success",
    data: mapListingId(updatedListing),
  });
});

exports.transitionListingToPendingPayment = catchAsync(async (req, res, next) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });

  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  if (listing.userId !== req.user.id) {
    return next(new AppError("You do not own this listing", 403));
  }

  if (listing.status !== "active") {
    return next(
      new AppError("Only active listings can be transitioned to pending payment.", 400)
    );
  }

  if (!(listing.paymentDeadline instanceof Date) || listing.paymentDeadline <= new Date()) {
    return next(
      new AppError(
        "Only listings still within the payment window can be transitioned to pending payment.",
        400
      )
    );
  }

  const updatedListing = await prisma.listing.update({
    where: { id: req.params.id },
    data: { status: "pending_payment" },
  });

  res.status(200).json({
    status: "success",
    data: mapListingId(updatedListing),
  });
});

exports.getListings = catchAsync(async (req, res, next) => {
  await applyListingLifecycle();

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 6;
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: "asc" };
  if (req.query.sort) {
    const sortQuery = req.query.sort.split("_");
    if (sortQuery[0] === "regularPrice") sortQuery[0] = "monthlyRent";
    orderBy = {
      [sortQuery[0]]: sortQuery[1] === "desc" ? "desc" : "asc",
    };
  }

  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const where = {
    status: isPremium ? { in: ["active", "early_access"] } : "active",
  };
  const AND = [];

  const searchTerm = (req.query.searchTerm || "").toString().trim();
  if (searchTerm) {
    AND.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const province = (req.query.province || "").toString().trim();
  const location = (req.query.location || "").toString().trim();
  if (province) {
    AND.push({
      province: { contains: province, mode: "insensitive" },
    });
  } else if (location) {
    AND.push({
      province: { contains: location, mode: "insensitive" },
    });
  }

  const minRent = Number(req.query.minRent || 0);
  const maxRent = Number(req.query.maxRent || 0);
  if (minRent || maxRent) {
    where.monthlyRent = {};
    if (minRent) where.monthlyRent.gte = minRent;
    if (maxRent) where.monthlyRent.lte = maxRent;
  }

  const minBedrooms = Number(req.query.minBedrooms || 0);
  if (minBedrooms) {
    where.bedrooms = { gte: minBedrooms };
  }

  const minTotalRooms = Number(req.query.minTotalRooms || 0);
  if (minTotalRooms) {
    where.totalRooms = { gte: minTotalRooms };
  }

  const amenityKeys = ["solar", "borehole", "security", "parking", "internet"];
  for (const key of amenityKeys) {
    if (req.query[key] === "true") {
      AND.push({
        amenities: {
          path: [key],
          equals: true,
        },
      });
    }
  }

  if (req.query.type && req.query.type !== "all") {
    where.type = req.query.type;
  }

  if (req.query.furnished === "true") {
    where.furnished = true;
  }

  if (req.query.offer === "true") {
    where.offer = true;
  }

  if (req.query.studentAccommodation === "true") {
    where.studentAccommodation = true;
  }

  if (AND.length) {
    where.AND = AND;
  }

  const listings = await prisma.listing.findMany({
    where,
    skip,
    take: limit,
    orderBy,
  });

  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings.map(mapListingId),
  });
});

exports.getHomeHighlighted = catchAsync(async (req, res, next) => {
  await applyListingLifecycle();

  const limit = Math.max(1, Number(req.query.limit) || 9);
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const statusFilter = isPremium ? { in: ["active", "early_access"] } : "active";

  const listings = await prisma.listing.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  res.status(200).json({
    status: "success",
    results: listings.length,
    data: listings.map(mapListingId),
  });
});

exports.getHomeGroupedByLocation = catchAsync(async (req, res, next) => {
  await applyListingLifecycle();

  const locationsLimit = Math.max(1, Number(req.query.locationsLimit) || 6);
  const perLocation = Math.max(1, Number(req.query.perLocation) || 6);
  const isPremium = req.user ? isPremiumTenant(req.user) : false;
  const statusFilter = isPremium ? { in: ["active", "early_access"] } : "active";

  const listings = await prisma.listing.findMany({
    where: {
      status: statusFilter,
      province: { not: "" },
    },
    orderBy: { createdAt: "desc" },
  });

  const groups = new Map();
  for (const listing of listings) {
    const provinceKey = listing.province;
    if (!groups.has(provinceKey)) {
      groups.set(provinceKey, []);
    }
    groups.get(provinceKey).push(listing);
  }

  const grouped = Array.from(groups.entries())
    .map(([locationName, groupedListings]) => ({
      location: locationName,
      mostRecentListing: groupedListings[0]?.createdAt || null,
      listings: groupedListings.slice(0, perLocation).map((listing) => ({
        _id: listing.id,
        name: listing.name,
        monthlyRent: listing.monthlyRent,
        bedrooms: listing.bedrooms,
        totalRooms: listing.totalRooms,
        amenities: listing.amenities,
        status: listing.status,
        studentAccommodation: listing.studentAccommodation,
        createdAt: listing.createdAt,
        location: listing.province,
        image: getListingImage(listing.imageUrls),
      })),
    }))
    .sort((left, right) => {
      const leftTime = left.mostRecentListing ? new Date(left.mostRecentListing).getTime() : 0;
      const rightTime = right.mostRecentListing
        ? new Date(right.mostRecentListing).getTime()
        : 0;
      return rightTime - leftTime;
    })
    .slice(0, locationsLimit)
    .map(({ location: locationName, listings: locationListings }) => ({
      location: locationName,
      listings: locationListings,
    }));

  res.status(200).json({
    status: "success",
    results: grouped.length,
    data: grouped,
  });
});

exports.__testables = {
  matchesSavedSearch,
};
