const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");
const { getProvider } = require("../utils/paymentProvider");

const getUserId = (user) => user?.id || user?._id?.toString();

const mapId = (record) => {
  if (!record) {
    return record;
  }

  record._id = record.id;
  return record;
};

exports.initiateListingFee = catchAsync(async (req, res, next) => {
  const { listingId, phone } = req.body;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return next(new AppError("Listing not found", 404));
  }

  if (listing.userId !== getUserId(req.user).toString()) {
    return next(new AppError("Forbidden", 403));
  }

  if (!["pending_payment", "inactive", "active"].includes(listing.status)) {
    return next(new AppError("Listing is not awaiting payment", 400));
  }

  listing._id = listing.id;

  const provider = getProvider();
  const result = await provider.initiateListingFee(listing, {
    ...req.user,
    _id: getUserId(req.user),
    phone,
  });

  await prisma.payment.create({
    data: {
      type: "listing_fee",
      listingId: listing.id,
      userId: getUserId(req.user),
      transactionRef: result.transactionRef,
      status: "pending",
      method: "paynow",
      amount: parseFloat(process.env.LISTING_FEE_AMOUNT) || 0,
    },
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: "pending_payment" },
  });

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
    },
  });
});

exports.initiateTenantPremium = catchAsync(async (req, res) => {
  const { phone } = req.body;

  const provider = getProvider();
  const result = await provider.initiatePremiumSubscription({
    ...req.user,
    _id: getUserId(req.user),
    phone,
  });

  await prisma.payment.create({
    data: {
      type: "premium_subscription",
      userId: getUserId(req.user),
      transactionRef: result.transactionRef,
      status: "pending",
      method: "paynow",
      amount: parseFloat(process.env.TENANT_PREMIUM_AMOUNT) || 0,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
    },
  });
});

exports.getMyPayments = catchAsync(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: getUserId(req.user) },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  payments.forEach((payment) => {
    mapId(payment);
    mapId(payment.listing);
  });

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: payments,
  });
});
