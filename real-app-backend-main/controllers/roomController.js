const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Room = require("../models/roomModel");
const Booking = require("../models/bookingModel");
const BlockedDate = require("../models/blockedDateModel");

const AVAILABILITY_BOOKING_STATUSES = ["confirmed", "pending_confirmation"];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseRequiredDate = (value, label) => {
  const parsed = new Date(value);

  if (!value || Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${label}`, 400);
  }

  return parsed;
};

const ensureProviderOwnsRoom = async (roomId, userId) => {
  if (!isValidObjectId(roomId)) {
    throw new AppError("Invalid room id", 400);
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError("Room not found", 404);
  }

  if (!room.provider || !room.provider.equals(userId)) {
    throw new AppError("You do not own this room", 403);
  }

  return room;
};

const buildOverlapQuery = (startField, endField, from, to) => ({
  [startField]: { $lt: to },
  [endField]: { $gt: from },
});

exports.createRoom = catchAsync(async (req, res, next) => {
  if (req.user?.providerProfile?.verificationStatus !== "approved") {
    return next(new AppError("Provider verification required", 403));
  }

  const room = await Room.create({
    ...req.body,
    provider: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      room,
    },
  });
});

exports.getMyRooms = catchAsync(async (req, res) => {
  const rooms = await Room.find({ provider: req.user._id }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: rooms.length,
    data: {
      rooms,
    },
  });
});

exports.updateRoom = catchAsync(async (req, res, next) => {
  const room = await ensureProviderOwnsRoom(req.params.id, req.user._id);

  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    return next(new AppError("status cannot be updated via this endpoint", 400));
  }

  const updates = { ...req.body };
  delete updates.provider;
  delete updates.providerProfile;

  Object.assign(room, updates);
  await room.save();

  res.status(200).json({
    status: "success",
    data: {
      room,
    },
  });
});

exports.deleteRoom = catchAsync(async (req, res, next) => {
  const room = await ensureProviderOwnsRoom(req.params.id, req.user._id);

  room.status = "inactive";
  await room.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createRoomBlock = catchAsync(async (req, res, next) => {
  await ensureProviderOwnsRoom(req.params.id, req.user._id);

  const startDate = parseRequiredDate(req.body.startDate, "startDate");
  const endDate = parseRequiredDate(req.body.endDate, "endDate");

  if (startDate >= endDate) {
    return next(new AppError("startDate must be before endDate", 400));
  }

  const blockedDate = await BlockedDate.create({
    room: req.params.id,
    provider: req.user._id,
    startDate,
    endDate,
    reason: req.body.reason || "",
  });

  res.status(201).json({
    status: "success",
    data: {
      blockedDate,
    },
  });
});

exports.deleteRoomBlock = catchAsync(async (req, res, next) => {
  await ensureProviderOwnsRoom(req.params.id, req.user._id);

  if (!isValidObjectId(req.params.blockId)) {
    return next(new AppError("Invalid block id", 400));
  }

  const deletedBlock = await BlockedDate.findOneAndDelete({
    _id: req.params.blockId,
    room: req.params.id,
  });

  if (!deletedBlock) {
    return next(new AppError("Blocked date not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getRoomAvailability = catchAsync(async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid room id", 400));
  }

  const room = await Room.findById(req.params.id).select("_id");
  if (!room) {
    return next(new AppError("Room not found", 404));
  }

  const from = parseRequiredDate(req.query.checkIn || req.query.from, "checkIn");
  const to = parseRequiredDate(req.query.checkOut || req.query.to, "checkOut");

  if (from >= to) {
    return next(new AppError("from must be before to", 400));
  }

  const [bookings, blockedDates] = await Promise.all([
    Booking.find({
      room: req.params.id,
      status: { $in: AVAILABILITY_BOOKING_STATUSES },
      ...buildOverlapQuery("checkIn", "checkOut", from, to),
    })
      .select("checkIn checkOut")
      .sort("checkIn"),
    BlockedDate.find({
      room: req.params.id,
      ...buildOverlapQuery("startDate", "endDate", from, to),
    })
      .select("startDate endDate reason")
      .sort("startDate"),
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
