const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const { MONETIZATION_MODE } = require("../utils/monetization");

/**
 * Landlord subscription endpoint (MVP mock implementation).
 * Repeated successful calls are idempotent for paid status.
 */
exports.createPremiumPayment = catchAsync(async (req, res, next) => {
  if (!req.user) return next(new AppError("Not authenticated", 401));

  if (MONETIZATION_MODE !== "LANDLORD_PAID") {
    return next(new AppError("Payment flow not enabled for current monetization mode", 400));
  }

  if (req.user.role !== "landlord") {
    return next(new AppError("Only landlords can subscribe to publish listings", 403));
  }

  const { amount, method, durationDays } = req.body;
  const normalizedMethod = method || "mock";
  const normalizedAmount = Number(amount || 0) || 0;
  const now = new Date();
  const days = Number(durationDays || 30);
  const landlordPaidUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const payment = await Payment.create({
    user: req.user._id,
    amount: normalizedAmount,
    method: normalizedMethod,
    status: "success", // MVP: treat as successful
  });

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      landlordPlan: "pro",
      landlordPaidUntil,
    },
    { new: true }
  );
  updated.password = undefined;

  res.status(200).json({
    status: "success",
    data: {
      payment,
      user: updated,
    },
  });
});
