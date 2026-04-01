const mongoose = require("mongoose");

const blockedDateSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "Blocked date must reference a room"],
    },
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      default: null,
    },
    startDate: {
      type: Date,
      required: [true, "Please provide a block start date"],
    },
    endDate: {
      type: Date,
      required: [true, "Please provide a block end date"],
    },
    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

blockedDateSchema.index({ room: 1, startDate: 1, endDate: 1 });

const BlockedDate =
  mongoose.models.BlockedDate || mongoose.model("BlockedDate", blockedDateSchema);

module.exports = BlockedDate;
