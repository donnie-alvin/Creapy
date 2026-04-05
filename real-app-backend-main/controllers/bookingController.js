const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const { getProvider } = require("../utils/paymentProvider");
const { resolvePrice } = require("../utils/pricingResolver");
const { sendEmail } = require("../utils/email");
const {
  bookingRequestSubmittedProvider,
  bookingRequestAcceptedGuest,
  bookingRequestDeclinedGuest,
  bookingCancelledByGuestProvider,
  bookingCancelledByProviderGuest,
  bookingSettledProvider,
} = require("../utils/emailTemplates/stayEmails");

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
  guest: {
    type: objectId,
    ref: "User",
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  paymentStatus: {
    type: String,
    default: "unpaid",
  },
});

const BlockedDate = getModel("BlockedDate", {
  room: {
    type: objectId,
    ref: "Room",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

const BOOKING_CANCELLED_STATUSES = ["cancelled", "canceled", "rejected", "declined", "expired"];
const SETTLEMENT_INELIGIBLE_STATUSES = [...BOOKING_CANCELLED_STATUSES, "settled"];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseDate = (value, label) => {
  const parsed = new Date(value);

  if (!value || Number.isNaN(parsed.getTime())) {
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

const getUserPhone = (user, explicitPhone) =>
  explicitPhone || user?.phone || user?.phoneNumber || null;

const getRoomOwnerIdentity = (room) =>
  [
    room?.provider,
    room?.providerId,
    room?.owner,
    room?.user,
    room?.providerProfile,
    room?.providerProfile?._id,
  ]
    .filter(Boolean)
    .map((value) => value.toString());

const getBookingMode = (room, booking) =>
  booking?.bookingMode ||
  room?.bookingMode ||
  room?.bookingSettings?.mode ||
  room?.settings?.bookingMode ||
  "request";

const getNightCount = (checkIn, checkOut) => {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};

const resolveBookingPricing = (room, checkIn, checkOut) => {
  const nights = getNightCount(checkIn, checkOut);

  if (nights <= 0) {
    throw new AppError("checkOut must be after checkIn", 400);
  }

  const pricePerNight = Number(
    resolvePrice(room, checkIn, checkOut) ??
      room?.pricePerNight ??
      room?.basePricePerNight ??
      room?.nightlyRate ??
      room?.price ??
      0
  );

  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    throw new AppError("Stay pricing is not configured", 400);
  }

  return {
    nights,
    pricePerNight,
    totalPrice: Number((pricePerNight * nights).toFixed(2)),
  };
};

const ensureRoomAvailability = async (roomId, checkIn, checkOut) => {
  const overlapCondition = buildOverlapCondition(checkIn, checkOut, [
    ["checkIn", "checkOut"],
    ["startDate", "endDate"],
    ["from", "to"],
  ]);

  const blockedCondition = buildOverlapCondition(checkIn, checkOut, [
    ["startDate", "endDate"],
    ["checkIn", "checkOut"],
    ["from", "to"],
  ]);

  const [bookingOverlap, blockedOverlap] = await Promise.all([
    Booking.findOne({
      room: roomId,
      status: { $nin: BOOKING_CANCELLED_STATUSES },
      ...overlapCondition,
    }).lean(),
    BlockedDate.findOne({
      room: roomId,
      ...blockedCondition,
    }).lean(),
  ]);

  if (bookingOverlap || blockedOverlap) {
    throw new AppError("Selected dates are not available", 409);
  }
};

const populateBookings = (query) =>
  query
    .populate("room")
    .populate("guest", "username email phoneNumber avatar")
    .sort("-createdAt");

const ensureBookingOwner = (booking, userId) => {
  if (!booking?.guest || booking.guest.toString() !== userId.toString()) {
    throw new AppError("You do not own this booking", 403);
  }
};

const ensureProviderOwnsBooking = (booking, userId) => {
  const ownerIds = getRoomOwnerIdentity(booking.room);

  if (!ownerIds.includes(userId.toString())) {
    throw new AppError("You do not own this stay", 403);
  }
};

const sendEmailSafe = async (payload) => {
  if (!payload?.to) {
    return;
  }

  try {
    await sendEmail(payload);
  } catch (err) {
    console.error("[email] send failed:", err.message);
  }
};

const resolveProviderEmail = async (room) => {
  const [providerId] = getRoomOwnerIdentity(room);

  if (!providerId) {
    return null;
  }

  return User.findById(providerId).select("email businessName providerProfile");
};

exports.createBooking = catchAsync(async (req, res, next) => {
  const roomId = req.body.room || req.body.roomId;
  const { checkIn: rawCheckIn, checkOut: rawCheckOut } = req.body;

  if (!isValidObjectId(roomId)) {
    return next(new AppError("Invalid room id", 400));
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError("Stay not found", 404));
  }

  const checkIn = parseDate(rawCheckIn, "checkIn");
  const checkOut = parseDate(rawCheckOut, "checkOut");

  if (checkIn >= checkOut) {
    return next(new AppError("checkOut must be after checkIn", 400));
  }

  await ensureRoomAvailability(room._id, checkIn, checkOut);

  const pricing = resolveBookingPricing(room, checkIn, checkOut);
  const bookingMode = getBookingMode(room);
  const booking = await Booking.create({
    ...req.body,
    room: room._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    bookingMode,
    provider: room.provider || room.providerId || room.owner || room.user || null,
    nights: pricing.nights,
    pricePerNight: pricing.pricePerNight,
    totalPrice: pricing.totalPrice,
    amount: pricing.totalPrice,
    status: bookingMode === "instant" ? "payment_pending" : "pending_confirmation",
    paymentStatus: "unpaid",
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate("room")
    .populate("guest", "username email phoneNumber avatar");

  const provider = await resolveProviderEmail(populatedBooking.room);
  const emailContext = {
    booking: populatedBooking,
    room: populatedBooking.room,
    guest: populatedBooking.guest,
    provider,
  };

  if (bookingMode === "request") {
    void sendEmailSafe(bookingRequestSubmittedProvider(emailContext));
  }

  res.status(201).json({
    status: "success",
    data: {
      booking: populatedBooking,
    },
  });
});

exports.getMyBookings = catchAsync(async (req, res) => {
  const bookings = await populateBookings(Booking.find({ guest: req.user._id }));

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room")
    .populate("guest", "email username");
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  const isGuestCancellation =
    booking?.guest && booking.guest._id.toString() === req.user._id.toString();
  const isProviderCancellation = getRoomOwnerIdentity(booking.room).includes(
    req.user._id.toString()
  );

  if (!isGuestCancellation && !isProviderCancellation) {
    return next(new AppError("You do not own this booking", 403));
  }

  if (BOOKING_CANCELLED_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking is already cancelled", 400));
  }

  booking.status = "cancelled";
  booking.cancelledBy = isProviderCancellation ? "provider" : "guest";
  booking.cancelledAt = new Date();
  await booking.save();

  const provider = await resolveProviderEmail(booking.room);
  const cancellationEmail = isProviderCancellation
    ? bookingCancelledByProviderGuest({
        booking,
        room: booking.room,
        guest: booking.guest,
        provider,
      })
    : bookingCancelledByGuestProvider({
        booking,
        room: booking.room,
        guest: booking.guest,
        provider,
      });
  void sendEmailSafe(cancellationEmail);

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.getProviderBookings = catchAsync(async (req, res) => {
  const rooms = await Room.find({
    $or: [
      { provider: req.user._id },
      { providerId: req.user._id },
      { owner: req.user._id },
      { user: req.user._id },
      { providerProfile: req.user._id },
    ],
  }).select("_id");

  const bookings = await populateBookings(
    Booking.find({ room: { $in: rooms.map((room) => room._id) } })
  );

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.confirmBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room")
    .populate("guest", "email username");
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureProviderOwnsBooking(booking, req.user._id);

  if (SETTLEMENT_INELIGIBLE_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking cannot be confirmed", 400));
  }

  booking.status = "confirmed";
  booking.confirmedAt = new Date();
  await booking.save();

  const provider = await resolveProviderEmail(booking.room);
  void sendEmailSafe(
    bookingRequestAcceptedGuest({
      booking,
      room: booking.room,
      guest: booking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.declineBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room")
    .populate("guest", "email username");
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureProviderOwnsBooking(booking, req.user._id);

  if (SETTLEMENT_INELIGIBLE_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking cannot be declined", 400));
  }

  booking.status = "declined";
  booking.declineReason = req.body.reason || null;
  booking.declinedAt = new Date();
  await booking.save();

  const provider = await resolveProviderEmail(booking.room);
  void sendEmailSafe(
    bookingRequestDeclinedGuest({
      booking,
      room: booking.room,
      guest: booking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.getAdminBookings = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  if (req.query.settlementStatus === "settled") {
    filter.$or = [{ settlementStatus: "settled" }, { settledAt: { $ne: null } }];
  } else if (req.query.settlementStatus === "pending") {
    filter.$and = [
      {
        $or: [{ settlementStatus: { $exists: false } }, { settlementStatus: { $ne: "settled" } }],
      },
      {
        $or: [{ settledAt: { $exists: false } }, { settledAt: null }],
      },
    ];
  }

  if (req.query.guestId) {
    if (!isValidObjectId(req.query.guestId)) {
      return next(new AppError("Invalid guest id", 400));
    }
    filter.guest = req.query.guestId;
  }

  if (req.query.roomId) {
    if (!isValidObjectId(req.query.roomId)) {
      return next(new AppError("Invalid room id", 400));
    }
    filter.room = req.query.roomId;
  }

  if (req.query.provider) {
    if (!isValidObjectId(req.query.provider)) {
      return next(new AppError("Invalid provider id", 400));
    }

    const rooms = await Room.find({
      $or: [
        { provider: req.query.provider },
        { providerId: req.query.provider },
        { owner: req.query.provider },
        { user: req.query.provider },
        { providerProfile: req.query.provider },
      ],
    }).select("_id");

    filter.room = { $in: rooms.map((room) => room._id) };
  }

  if (req.query.dateFrom || req.query.dateTo) {
    const createdAt = {};

    if (req.query.dateFrom) {
      const dateFrom = new Date(req.query.dateFrom);
      if (Number.isNaN(dateFrom.getTime())) {
        return next(new AppError("Invalid dateFrom", 400));
      }
      createdAt.$gte = dateFrom;
    }

    if (req.query.dateTo) {
      const dateTo = new Date(req.query.dateTo);
      if (Number.isNaN(dateTo.getTime())) {
        return next(new AppError("Invalid dateTo", 400));
      }
      createdAt.$lte = dateTo;
    }

    filter.createdAt = createdAt;
  }

  const bookings = await populateBookings(Booking.find(filter));

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.settleBooking = catchAsync(async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid booking id", 400));
  }

  const booking = await Booking.findById(req.params.id).populate("room");
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

  const provider = await resolveProviderEmail(booking.room);
  void sendEmailSafe(
    bookingSettledProvider({
      booking,
      room: booking.room,
      guest: booking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

exports.initiateBookingPayment = catchAsync(async (req, res, next) => {
  const { bookingId, phone } = req.body;

  if (!isValidObjectId(bookingId)) {
    return next(new AppError("Invalid booking id", 400));
  }

  const booking = await Booking.findById(bookingId).populate("room");
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureBookingOwner(booking, req.user._id);

  if (String(booking.paymentStatus || "").toLowerCase() === "paid") {
    return next(new AppError("Booking is already paid", 400));
  }

  if (BOOKING_CANCELLED_STATUSES.includes(String(booking.status || "").toLowerCase())) {
    return next(new AppError("Cancelled bookings cannot be paid", 400));
  }

  const amount = Number(booking.totalPrice || booking.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new AppError("Booking amount is invalid", 400));
  }

  const provider = getProvider();
  const result = await provider.initiateBookingPayment(booking, {
    ...req.user.toObject(),
    phone: getUserPhone(req.user, phone),
  });

  const payment = await Payment.create({
    type: "booking_payment",
    booking: booking._id,
    user: req.user._id,
    transactionRef: result.transactionRef,
    status: "pending",
    method: process.env.PAYMENT_PROVIDER === "paynow" ? "paynow" : "mock",
    amount,
  });

  booking.paymentRef = result.transactionRef;
  booking.paymentId = payment._id;
  booking.paymentStatus = "pending";
  await booking.save();

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
      paymentId: payment._id,
    },
  });
});
