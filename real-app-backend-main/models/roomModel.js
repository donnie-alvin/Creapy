const mongoose = require("mongoose");

const roomAmenitiesSchema = new mongoose.Schema(
  {
    wifi: { type: Boolean, default: false },
    aircon: { type: Boolean, default: false },
    tv: { type: Boolean, default: false },
    minibar: { type: Boolean, default: false },
    ensuite: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    breakfast: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    pool: { type: Boolean, default: false },
    conferenceRoom: { type: Boolean, default: false },
    airportPickup: { type: Boolean, default: false },
    familyFriendly: { type: Boolean, default: false },
  },
  { _id: false }
);

const pricingRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["weekend", "weekday", "holiday", "seasonal"],
      required: [true, "Pricing rule type is required"],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    pricePerNight: {
      type: Number,
      min: 0,
      required: [true, "Pricing rule pricePerNight is required"],
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Room must belong to a provider"],
    },
    name: {
      type: String,
      required: [true, "Please provide a room name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ["standard", "deluxe", "suite", "dormitory", "family", "single", "twin"],
    },
    capacity: {
      type: Number,
    },
    basePricePerNight: {
      type: Number,
      required: [true, "Please provide the nightly rate"],
      min: [0, "Nightly rate cannot be negative"],
    },
    pricingRules: {
      type: [pricingRuleSchema],
      default: [],
    },
    amenities: {
      type: roomAmenitiesSchema,
      default: () => ({}),
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["available", "blocked", "inactive"],
      default: "available",
    },
    bookingMode: {
      type: String,
      enum: ["instant", "request"],
      default: "instant",
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 90,
    },
    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict", "non_refundable", "custom"],
    },
    cancellationPolicyCustomText: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ provider: 1, status: 1 });

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

module.exports = Room;
