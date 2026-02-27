const mongoose = require("mongoose");

// Saved Search stores structured filter criteria and notification preferences.
const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "Saved Search",
      trim: true,
      maxlength: 80,
    },
    criteria: {
      location: { type: String, default: "" },
      minRent: { type: Number, default: 0 },
      maxRent: { type: Number, default: 0 },
      minBedrooms: { type: Number, default: 0 },
      amenities: {
        solar: { type: Boolean, default: false },
        borehole: { type: Boolean, default: false },
        security: { type: Boolean, default: false },
        parking: { type: Boolean, default: false },
        internet: { type: Boolean, default: false },
      },
    },
    notifyBy: {
      type: String,
      enum: ["email"],
      default: "email",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const SavedSearch = new mongoose.model("SavedSearch", savedSearchSchema);
module.exports = SavedSearch;
