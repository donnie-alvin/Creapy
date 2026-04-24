const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const prisma = require("../utils/prisma");

const AVAILABILITY_BOOKING_STATUSES = ["confirmed", "pending_confirmation"];

const parseRequiredDate = (value, label) => {
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

const ensureProviderOwnsRoom = async (roomId, userId) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new AppError("Room not found", 404);
  }

  if (room.providerId !== userId.toString()) {
    throw new AppError("You do not own this room", 403);
  }

  return room;
};

exports.createRoom = catchAsync(async (req, res, next) => {
  if (req.user?.providerProfile?.verificationStatus !== "approved") {
    return next(new AppError("Provider verification required", 403));
  }

  const input = { ...req.body };
  delete input.provider;
  delete input.providerProfile;
  delete input._id;
  delete input.id;

  const room = await prisma.room.create({
    data: {
      name: input.name,
      description: input.description,
      roomType: input.roomType,
      capacity: input.capacity,
      basePricePerNight: input.basePricePerNight,
      pricingRules: input.pricingRules,
      amenities: input.amenities,
      imageUrls: input.imageUrls,
      status: input.status,
      bookingMode: input.bookingMode,
      maxAdvanceBookingDays: input.maxAdvanceBookingDays,
      cancellationPolicy: input.cancellationPolicy,
      cancellationPolicyCustomText: input.cancellationPolicyCustomText,
      providerId: getUserId(req.user),
    },
  });

  mapId(room);

  res.status(201).json({
    status: "success",
    data: {
      room,
    },
  });
});

exports.getMyRooms = catchAsync(async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { providerId: getUserId(req.user) },
    orderBy: { createdAt: "desc" },
  });

  rooms.forEach(mapId);

  res.status(200).json({
    status: "success",
    results: rooms.length,
    data: {
      rooms,
    },
  });
});

exports.updateRoom = catchAsync(async (req, res) => {
  await ensureProviderOwnsRoom(req.params.id, getUserId(req.user));

  const updates = { ...req.body };
  delete updates.provider;
  delete updates.providerProfile;
  delete updates.providerId;
  delete updates._id;
  delete updates.id;

  const room = await prisma.room.update({
    where: { id: req.params.id },
    data: updates,
  });

  mapId(room);

  res.status(200).json({
    status: "success",
    data: {
      room,
    },
  });
});

exports.deleteRoom = catchAsync(async (req, res) => {
  await ensureProviderOwnsRoom(req.params.id, getUserId(req.user));

  await prisma.room.update({
    where: { id: req.params.id },
    data: { status: "inactive" },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createRoomBlock = catchAsync(async (req, res, next) => {
  await ensureProviderOwnsRoom(req.params.id, getUserId(req.user));

  const startDate = parseRequiredDate(req.body.startDate, "startDate");
  const endDate = parseRequiredDate(req.body.endDate, "endDate");

  if (startDate >= endDate) {
    return next(new AppError("startDate must be before endDate", 400));
  }

  const blockedDate = await prisma.blockedDate.create({
    data: {
      roomId: req.params.id,
      providerId: getUserId(req.user),
      startDate,
      endDate,
      reason: req.body.reason || "",
    },
  });

  mapId(blockedDate);

  res.status(201).json({
    status: "success",
    data: {
      blockedDate,
    },
  });
});

exports.deleteRoomBlock = catchAsync(async (req, res, next) => {
  await ensureProviderOwnsRoom(req.params.id, getUserId(req.user));

  const blockedDate = await prisma.blockedDate.findFirst({
    where: {
      id: req.params.blockId,
      roomId: req.params.id,
    },
  });

  if (!blockedDate) {
    return next(new AppError("Blocked date not found", 404));
  }

  await prisma.blockedDate.delete({
    where: { id: req.params.blockId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getRoomAvailability = catchAsync(async (req, res, next) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });

  if (!room) {
    return next(new AppError("Room not found", 404));
  }

  const from = parseRequiredDate(req.query.checkIn || req.query.from, "checkIn");
  const to = parseRequiredDate(req.query.checkOut || req.query.to, "checkOut");

  if (from >= to) {
    return next(new AppError("from must be before to", 400));
  }

  const [bookings, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        roomId: req.params.id,
        status: { in: AVAILABILITY_BOOKING_STATUSES },
        checkIn: { lt: to },
        checkOut: { gt: from },
      },
      select: { checkIn: true, checkOut: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: {
        roomId: req.params.id,
        startDate: { lt: to },
        endDate: { gt: from },
      },
      select: { startDate: true, endDate: true, reason: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      bookedRanges: bookings.map((booking) => ({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      })),
      blockedRanges: blockedDates.map((blockedDate) => ({
        startDate: blockedDate.startDate,
        endDate: blockedDate.endDate,
        reason: blockedDate.reason || "",
      })),
    },
  });
});
