const express = require("express");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.use(authController.protect);

router.post("/", bookingController.createBooking);
router.get("/mine", bookingController.getMyBookings);
router.post("/initiate-payment", bookingController.initiateBookingPayment);
router.post("/:id/cancel", bookingController.cancelBooking);
router.get("/provider", bookingController.getProviderBookings);
router.post("/:id/confirm", bookingController.confirmBooking);
router.post("/:id/decline", bookingController.declineBooking);
router.get(
  "/",
  authController.requireRole("admin"),
  bookingController.getAdminBookings
);
router.get(
  "/admin",
  authController.requireRole("admin"),
  bookingController.getAdminBookings
);
router.put(
  "/:id/settle",
  authController.requireRole("admin"),
  bookingController.settleBooking
);
router.post(
  "/:id/settle",
  authController.requireRole("admin"),
  bookingController.settleBooking
);

module.exports = router;
