const Payment = require("../models/paymentModel");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");
const { getProvider } = require("../utils/paymentProvider");
const mongoose = require("mongoose");

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
  status: {
    type: String,
    default: "pending",
  },
  paymentStatus: {
    type: String,
    default: "unpaid",
  },
});

// Successful payment statuses from Paynow (normalized to lowercase)
const SUCCESSFUL_STATUSES = ["paid"];

exports.handlePaynowWebhook = async (req, res) => {
  try {
    // Step 1 — Verify hash
    const provider = getProvider();
    const result = await provider.verifyWebhook(req.body);
    if (!result.valid) {
      return res.status(200).json({ status: "ignored", reason: "invalid hash" });
    }

    // Step 2 — Check provider status (Comment 1: normalized to lowercase by provider)
    // Only process as success if provider reports successful status
    if (!SUCCESSFUL_STATUSES.includes(result.status)) {
      try {
        // Log non-success status for operational visibility
        console.log(
          `[webhook] Non-success status for transactionRef=${result.transactionRef}: status=${result.status}`
        );
        // Mark payment as failed but don't set webhookVerified to allow potential retries
        await Payment.findOneAndUpdate(
          { transactionRef: result.transactionRef },
          { status: "failed" },
          { new: true }
        );
      } catch (logErr) {
        console.log("[webhook] Error marking failed payment:", logErr.message);
      }
      return res.status(200).json({ status: "ok" });
    }

    // Step 3 — Atomic idempotency claim
    // Claim succeeds only once for a given transactionRef when webhookVerified is false.
    const claimedPayment = await Payment.findOneAndUpdate(
      { transactionRef: result.transactionRef, webhookVerified: false },
      { $set: { webhookVerified: true, status: "success" } },
      { new: true }
    );

    if (!claimedPayment) {
      // Unknown transactionRef or already processed; both are safe no-ops.
      return res.status(200).json({ status: "ok", reason: "already processed" });
    }

    // Step 6 — Apply side effects only after successful atomic claim
    // Defer payment finalization until after side effects (Comment 3)
    try {
      // Step 6a — listing_fee side-effect
      if (claimedPayment.type === "listing_fee") {
        if (
          req.query?.earlyAccess === "true" &&
          process.env.PAYMENT_PROVIDER !== "paynow"
        ) {
          await Listing.findByIdAndUpdate(claimedPayment.listing, {
            status: "early_access",
            earlyAccessUntil: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
            paymentDeadline: null,
          });
        } else {
          await Listing.findByIdAndUpdate(claimedPayment.listing, {
            status: "active",
            paymentDeadline: null,
          });
        }
      }

      // Step 6b — premium_subscription side-effect
      if (claimedPayment.type === "premium_subscription") {
        const user = await User.findById(claimedPayment.user);
        const base =
          user.premiumExpiry && user.premiumExpiry > new Date()
            ? user.premiumExpiry
            : new Date();
        await User.findByIdAndUpdate(claimedPayment.user, {
          premiumExpiry: new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      if (claimedPayment.type === "booking_payment") {
        const booking = await Booking.findById(claimedPayment.booking).populate("room");

        if (!booking) {
          throw new Error("Booking not found");
        }

        booking.paymentStatus = "paid";
        if (booking.status === "pending_confirmation" && booking.room.bookingMode === "instant") {
          booking.status = "confirmed";
        }
        await booking.save();
      }

      // Step 7 — Respond OK after all side effects succeed
      return res.status(200).json({ status: "ok" });
    } catch (sideEffectErr) {
      // If side effects fail, reset the atomic claim to allow retry (Comment 3)
      console.log(
        `[webhook] Side effect error for transactionRef=${result.transactionRef}: ${sideEffectErr.message}`
      );
      try {
        await Payment.findByIdAndUpdate(claimedPayment._id, {
          webhookVerified: false,
          status: "pending",
        });
      } catch (resetErr) {
        console.log("[webhook] Error resetting webhook claim:", resetErr.message);
      }
      // Always return HTTP 200 to avoid triggering Paynow retries unnecessarily,
      // but the payment remains in pending state for manual or automatic retry
      return res.status(200).json({ status: "error" });
    }
  } catch (err) {
    // Catch all errors and respond HTTP 200 to prevent Paynow retries
    console.log("[webhook] Unexpected error:", err.message);
    return res.status(200).json({ status: "error" });
  }
};
