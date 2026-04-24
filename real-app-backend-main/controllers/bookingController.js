const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");
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

const BOOKING_CANCELLED_STATUSES = ["cancelled", "canceled", "rejected", "declined", "expired"];
const SETTLEMENT_INELIGIBLE_STATUSES = [...BOOKING_CANCELLED_STATUSES, "settled"];

const parseDate = (value, label) => {
  const parsed = new Date(value);

  if (!value || Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${label}`, 400);
  }

  return parsed;
};

const getUserId = (user) => user?.id || user?._id?.toString();

const mapId = (record) => {
  if (!record) {
    return record;
  }

  record._id = record.id;
  return record;
};

const mapBooking = (booking) => {
  if (!booking) {
    return booking;
  }

  mapId(booking);
  mapId(booking.room);
  mapId(booking.guest);
  return booking;
};

const getUserPhone = (user, explicitPhone) =>
  explicitPhone || user?.phone || user?.phoneNumber || null;

const getRoomOwnerIdentity = (room) =>
  [room?.providerId, room?.provider, room?.owner, room?.user]
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

const normalizeGuestCount = (guestCount, guests) => {
  const rawGuestCount = guestCount ?? guests;

  if (rawGuestCount === undefined || rawGuestCount === null || rawGuestCount === "") {
    return null;
  }

  const normalizedGuestCount = Number(rawGuestCount);

  if (!Number.isInteger(normalizedGuestCount) || normalizedGuestCount < 1) {
    throw new AppError("Invalid guestCount", 400);
  }

  return normalizedGuestCount;
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
  const [bookingOverlap, blockedOverlap] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        roomId,
        status: { notIn: BOOKING_CANCELLED_STATUSES },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
    prisma.blockedDate.findFirst({
      where: {
        roomId,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
    }),
  ]);

  if (bookingOverlap || blockedOverlap) {
    throw new AppError("Selected dates are not available", 409);
  }
};

const populateBookings = async (where) => {
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  bookings.forEach(mapBooking);
  return bookings;
};

const ensureBookingOwner = (booking, userId) => {
  if (!booking || booking.guestId !== userId.toString()) {
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

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    select: { id: true, email: true, providerProfile: true },
  });

  return mapId(provider);
};

exports.createBooking = catchAsync(async (req, res, next) => {
  const roomId = req.body.room || req.body.roomId;
  const { checkIn: rawCheckIn, checkOut: rawCheckOut } = req.body;

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return next(new AppError("Stay not found", 404));
  }

  const checkIn = parseDate(rawCheckIn, "checkIn");
  const checkOut = parseDate(rawCheckOut, "checkOut");

  if (checkIn >= checkOut) {
    return next(new AppError("checkOut must be after checkIn", 400));
  }

  await ensureRoomAvailability(room.id, checkIn, checkOut);

  const pricing = resolveBookingPricing(room, checkIn, checkOut);
  const normalizedGuestCount = normalizeGuestCount(req.body.guestCount, req.body.guests);
  const bookingMode = getBookingMode(room);
  const booking = await prisma.booking.create({
    data: {
      roomId: room.id,
      guestId: getUserId(req.user),
      checkIn,
      checkOut,
      bookingMode,
      providerId: room.providerId || null,
      nights: pricing.nights,
      pricePerNight: pricing.pricePerNight,
      totalPrice: pricing.totalPrice,
      totalAmount: pricing.totalPrice,
      status: bookingMode === "instant" ? "pending_payment" : "pending_confirmation",
      paymentStatus: "unpaid",
      specialRequests: req.body.specialRequests || "",
      guestCount: normalizedGuestCount,
    },
  });

  const populatedBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          avatar: true,
        },
      },
    },
  });

  mapBooking(populatedBooking);

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
  const bookings = await populateBookings({ guestId: getUserId(req.user) });

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  const userId = getUserId(req.user).toString();
  const isGuestCancellation = booking.guestId === userId;
  const isProviderCancellation = getRoomOwnerIdentity(booking.room).includes(userId);

  if (!isGuestCancellation && !isProviderCancellation) {
    return next(new AppError("You do not own this booking", 403));
  }

  if (BOOKING_CANCELLED_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking is already cancelled", 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "cancelled",
      cancelledBy: isProviderCancellation ? "provider" : "guest",
      cancelledAt: new Date(),
    },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  mapBooking(updatedBooking);

  const provider = await resolveProviderEmail(updatedBooking.room);
  const cancellationEmail = isProviderCancellation
    ? bookingCancelledByProviderGuest({
        booking: updatedBooking,
        room: updatedBooking.room,
        guest: updatedBooking.guest,
        provider,
      })
    : bookingCancelledByGuestProvider({
        booking: updatedBooking,
        room: updatedBooking.room,
        guest: updatedBooking.guest,
        provider,
      });
  void sendEmailSafe(cancellationEmail);

  res.status(200).json({
    status: "success",
    data: {
      booking: updatedBooking,
    },
  });
});

exports.getProviderBookings = catchAsync(async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { providerId: getUserId(req.user) },
    select: { id: true },
  });

  const roomIds = rooms.map((room) => room.id);
  const bookings = await populateBookings({ roomId: { in: roomIds } });

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.confirmBooking = catchAsync(async (req, res, next) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureProviderOwnsBooking(booking, getUserId(req.user));

  if (SETTLEMENT_INELIGIBLE_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking cannot be confirmed", 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "confirmed",
    },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  mapBooking(updatedBooking);

  const provider = await resolveProviderEmail(updatedBooking.room);
  void sendEmailSafe(
    bookingRequestAcceptedGuest({
      booking: updatedBooking,
      room: updatedBooking.room,
      guest: updatedBooking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking: updatedBooking,
    },
  });
});

exports.declineBooking = catchAsync(async (req, res, next) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureProviderOwnsBooking(booking, getUserId(req.user));

  if (SETTLEMENT_INELIGIBLE_STATUSES.includes(String(booking.status).toLowerCase())) {
    return next(new AppError("Booking cannot be declined", 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "declined",
      cancellationReason: req.body.reason || null,
    },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  mapBooking(updatedBooking);

  const provider = await resolveProviderEmail(updatedBooking.room);
  void sendEmailSafe(
    bookingRequestDeclinedGuest({
      booking: updatedBooking,
      room: updatedBooking.room,
      guest: updatedBooking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking: updatedBooking,
    },
  });
});

exports.getAdminBookings = catchAsync(async (req, res) => {
  const where = {};

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.paymentStatus) {
    where.paymentStatus = req.query.paymentStatus;
  }

  if (req.query.settlementStatus === "settled") {
    where.OR = [{ settlementStatus: "settled" }, { settledAt: { not: null } }];
  } else if (req.query.settlementStatus === "pending") {
    where.AND = [
      { settlementStatus: { not: "settled" } },
      { settledAt: null },
    ];
  }

  if (req.query.guestId) {
    where.guestId = req.query.guestId;
  }

  if (req.query.roomId) {
    where.roomId = req.query.roomId;
  }

  if (req.query.provider) {
    const rooms = await prisma.room.findMany({
      where: { providerId: req.query.provider },
      select: { id: true },
    });

    where.roomId = { in: rooms.map((room) => room.id) };
  }

  if (req.query.dateFrom || req.query.dateTo) {
    const createdAt = {};

    if (req.query.dateFrom) {
      createdAt.gte = parseDate(req.query.dateFrom, "dateFrom");
    }

    if (req.query.dateTo) {
      createdAt.lte = parseDate(req.query.dateTo, "dateTo");
    }

    where.createdAt = createdAt;
  }

  const bookings = await populateBookings(where);

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

exports.settleBooking = catchAsync(async (req, res, next) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { room: true },
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
    where: { id: booking.id },
    data: {
      settlementStatus: "settled",
      settledAt: new Date(),
      settlementReference: req.body.settlementReference || null,
    },
    include: {
      room: true,
      guest: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  mapBooking(updatedBooking);

  const provider = await resolveProviderEmail(updatedBooking.room);
  void sendEmailSafe(
    bookingSettledProvider({
      booking: updatedBooking,
      room: updatedBooking.room,
      guest: updatedBooking.guest,
      provider,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      booking: updatedBooking,
    },
  });
});

exports.initiateBookingPayment = catchAsync(async (req, res, next) => {
  const { bookingId, phone } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  ensureBookingOwner(booking, getUserId(req.user));

  if (String(booking.paymentStatus || "").toLowerCase() === "paid") {
    return next(new AppError("Booking is already paid", 400));
  }

  if (BOOKING_CANCELLED_STATUSES.includes(String(booking.status || "").toLowerCase())) {
    return next(new AppError("Cancelled bookings cannot be paid", 400));
  }

  mapId(booking);
  mapId(booking.room);

  const amount = Number(booking.totalPrice || booking.totalAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new AppError("Booking amount is invalid", 400));
  }

  const provider = getProvider();
  const result = await provider.initiateBookingPayment(booking, {
    ...req.user,
    _id: getUserId(req.user),
    phone: getUserPhone(req.user, phone),
  });

  const payment = await prisma.payment.create({
    data: {
      type: "booking_payment",
      bookingId: booking.id,
      userId: getUserId(req.user),
      transactionRef: result.transactionRef,
      status: "pending",
      method: process.env.PAYMENT_PROVIDER === "paynow" ? "paynow" : "mock",
      amount,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentRef: result.transactionRef,
      paymentStatus: "pending",
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      transactionRef: result.transactionRef,
      instructions: result.instructions,
      paymentId: payment.id,
    },
  });
});
