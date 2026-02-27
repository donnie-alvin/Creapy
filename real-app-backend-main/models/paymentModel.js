const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["mock", "mobile_money", "card", "paynow"],
      default: "mock",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["listing_fee", "premium_subscription"],
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    transactionRef: {
      type: String,
      unique: true,
      sparse: true,
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


const Payment = new mongoose.model("Payment", paymentSchema);
module.exports = Payment;
