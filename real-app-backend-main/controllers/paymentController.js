const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Payment = require("../models/paymentModel");
const Listing = require("../models/listingModel");
const { getProvider } = require("../utils/paymentProvider");

exports.initiateListingFee = catchAsync(async (req, res, next) => {
  const { listingId, phone } = req.body;

  // Find listing
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return next(new AppError("Listing not found", 404));
  }

  // Check ownership
  if (listing.user.toString() !== req.user._id.toString()) {
    return next(new AppError("Forbidden", 403));
  }

  // Check status
  if (!["pending_payment", "inactive", "active"].includes(listing.status)) {
    return next(new AppError("Listing is not awaiting payment", 400));
  }

  // Get provider and initiate payment
  const provider = getProvider();
  const result = await provider.initiateListingFee(listing, {
    ...req.user.toObject(),
    phone,
  });

  // Create payment record
  const payment = await Payment.create({
    type: "listing_fee",
    listing: listing._id,
    user: req.user._id,
    transactionRef: result.transactionRef,
    status: "pending",
    method: "paynow",
    amount: parseFloat(process.env.LISTING_FEE_AMOUNT) || 0,
  });

  await Listing.findByIdAndUpdate(
    listing._id,
    { status: "pending_payment" },
    { new: false }
  );

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
    },
  });
});

exports.initiateTenantPremium = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  // Get provider and initiate payment
  const provider = getProvider();
  const result = await provider.initiatePremiumSubscription({
    ...req.user.toObject(),
    phone,
  });

  // Create payment record
  const payment = await Payment.create({
    type: "premium_subscription",
    user: req.user._id,
    transactionRef: result.transactionRef,
    status: "pending",
    method: "paynow",
    amount: parseFloat(process.env.TENANT_PREMIUM_AMOUNT) || 0,
  });

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
    },
  });
});

exports.getMyPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("listing", "name status");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: payments,
  });
});
