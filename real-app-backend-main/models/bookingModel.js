const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "Booking must reference a room"],
    },
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Booking must reference a provider"],
    },
    guest: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Booking must reference a guest"],
    },
    checkIn: {
      type: Date,
      required: [true, "Please provide a check-in date"],
    },
    checkOut: {
      type: Date,
      required: [true, "Please provide a check-out date"],
    },
    nights: {
      type: Number,
      min: 0,
    },
    pricePerNight: {
      type: Number,
    },
    subtotal: {
      type: Number,
    },
    commissionRate: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "pending_confirmation",
        "confirmed",
        "cancelled",
        "completed",
      ],
      default: "pending_confirmation",
    },
    bookingMode: {
      type: String,
      enum: ["instant", "request"],
    },
    guestCount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentRef: {
      type: String,
    },
    settlementStatus: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
    },
    specialRequests: {
      type: String,
      default: "",
    },
    cancelledBy: {
      type: String,
      enum: ["guest", "provider", "admin"],
      default: null,
    },
    cancellationReason: {
      type: String,
    },
    cancellationPolicy: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.pre("save", async function (next) {
  if (!this.checkIn || !this.checkOut || this.pricePerNight == null || this.commissionRate == null) {
    return next();
  }

  const checkIn = new Date(this.checkIn);
  const checkOut = new Date(this.checkOut);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime()) ||
    checkOut <= checkIn
  ) {
    return next(new Error("Booking checkOut must be after checkIn"));
  }

  this.nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
  this.subtotal = this.nights * this.pricePerNight;
  this.commissionAmount = (this.subtotal * this.commissionRate) / 100;
  this.totalAmount = this.subtotal;

  next();
});

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1, status: 1 });
bookingSchema.index({ provider: 1, guest: 1, createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
