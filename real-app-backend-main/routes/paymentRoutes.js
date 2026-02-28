const express = require("express");
const authController = require("../controllers/authController");
const paymentController = require("../controllers/paymentController");
const { paymentLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  listingFeeValidators,
  tenantPremiumValidators,
} = require("../middleware/paymentValidators");

const router = express.Router();

router.use(paymentLimiter);
router.use(authController.protect);

router.post(
  "/listing-fee",
  authController.requireRole("landlord"),
  listingFeeValidators,
  validate,
  paymentController.initiateListingFee
);

router.post(
  "/tenant-premium",
  authController.requireRole("tenant"),
  tenantPremiumValidators,
  validate,
  paymentController.initiateTenantPremium
);

router.get("/mine", paymentController.getMyPayments);

module.exports = router;
