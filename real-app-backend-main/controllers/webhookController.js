const prisma = require("../utils/prisma");
const { getProvider } = require("../utils/paymentProvider");
const { sendEmail } = require("../utils/email");
const {
  bookingConfirmedInstantGuest,
  bookingConfirmedInstantProvider,
  bookingPaymentSuccessGuest,
  bookingPaymentSuccessProvider,
} = require("../utils/emailTemplates/stayEmails");

const SUCCESSFUL_STATUSES = ["paid"];

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

exports.handlePaynowWebhook = async (req, res) => {
  try {
    const provider = getProvider();
    const result = await provider.verifyWebhook(req.body);
    if (!result.valid) {
      return res.status(200).json({ status: "ignored", reason: "invalid hash" });
    }

    if (!SUCCESSFUL_STATUSES.includes(result.status)) {
      try {
        console.log(
          `[webhook] Non-success status for transactionRef=${result.transactionRef}: status=${result.status}`
        );
        await prisma.payment.updateMany({
          where: { transactionRef: result.transactionRef },
          data: { status: "failed" },
        });
      } catch (logErr) {
        console.log("[webhook] Error marking failed payment:", logErr.message);
      }
      return res.status(200).json({ status: "ok" });
    }

    const updateResult = await prisma.payment.updateMany({
      where: {
        transactionRef: result.transactionRef,
        webhookVerified: false,
      },
      data: {
        webhookVerified: true,
        status: "success",
      },
    });

    if (updateResult.count === 0) {
      return res.status(200).json({ status: "ok", reason: "already processed" });
    }

    const claimedPayment = await prisma.payment.findFirst({
      where: { transactionRef: result.transactionRef },
    });

    if (!claimedPayment) {
      return res.status(200).json({ status: "ok", reason: "payment missing" });
    }

    try {
      if (claimedPayment.type === "listing_fee") {
        if (
          req.query?.earlyAccess === "true" &&
          process.env.PAYMENT_PROVIDER !== "paynow"
        ) {
          await prisma.listing.update({
            where: { id: claimedPayment.listingId },
            data: {
              status: "early_access",
              earlyAccessUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              paymentDeadline: null,
            },
          });
        } else {
          await prisma.listing.update({
            where: { id: claimedPayment.listingId },
            data: {
              status: "active",
              paymentDeadline: null,
            },
          });
        }
      }

      if (claimedPayment.type === "premium_subscription") {
        const user = await prisma.user.findUnique({
          where: { id: claimedPayment.userId },
        });
        const base =
          user.premiumExpiry && user.premiumExpiry > new Date()
            ? user.premiumExpiry
            : new Date();

        await prisma.user.update({
          where: { id: claimedPayment.userId },
          data: {
            premiumExpiry: new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      if (claimedPayment.type === "booking_payment") {
        const booking = await prisma.booking.findUnique({
          where: { id: claimedPayment.bookingId },
          include: { room: true },
        });

        if (!booking) {
          throw new Error("Booking not found");
        }

        const shouldConfirmInstantBooking =
          ["pending_payment", "payment_pending"].includes(booking.status) &&
          booking.room.bookingMode === "instant";

        const updatedBooking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: "paid",
            ...(shouldConfirmInstantBooking ? { status: "confirmed" } : {}),
          },
          include: { room: true },
        });

        updatedBooking._id = updatedBooking.id;
        updatedBooking.room._id = updatedBooking.room.id;

        const guest = await prisma.user.findUnique({
          where: { id: updatedBooking.guestId },
          select: { id: true, email: true, username: true },
        });
        const bookingProvider = await prisma.user.findUnique({
          where: { id: updatedBooking.room.providerId },
          select: { id: true, email: true, providerProfile: true },
        });

        if (guest) {
          guest._id = guest.id;
        }

        if (bookingProvider) {
          bookingProvider._id = bookingProvider.id;
        }

        void sendEmailSafe(
          bookingPaymentSuccessGuest({
            booking: updatedBooking,
            room: updatedBooking.room,
            guest,
            provider: bookingProvider,
          })
        );
        void sendEmailSafe(
          bookingPaymentSuccessProvider({
            booking: updatedBooking,
            room: updatedBooking.room,
            guest,
            provider: bookingProvider,
          })
        );

        if (shouldConfirmInstantBooking) {
          void sendEmailSafe(
            bookingConfirmedInstantGuest({
              booking: updatedBooking,
              room: updatedBooking.room,
              guest,
              provider: bookingProvider,
            })
          );
          void sendEmailSafe(
            bookingConfirmedInstantProvider({
              booking: updatedBooking,
              room: updatedBooking.room,
              guest,
              provider: bookingProvider,
            })
          );
        }
      }

      return res.status(200).json({ status: "ok" });
    } catch (sideEffectErr) {
      console.log(
        `[webhook] Side effect error for transactionRef=${result.transactionRef}: ${sideEffectErr.message}`
      );
      try {
        await prisma.payment.update({
          where: { id: claimedPayment.id },
          data: {
            webhookVerified: false,
            status: "pending",
          },
        });
      } catch (resetErr) {
        console.log("[webhook] Error resetting webhook claim:", resetErr.message);
      }
      return res.status(200).json({ status: "error" });
    }
  } catch (err) {
    console.log("[webhook] Unexpected error:", err.message);
    return res.status(200).json({ status: "error" });
  }
};
