const express = require("express");
const authController = require("../controllers/authController");
const providerController = require("../controllers/providerController");

const router = express.Router();

router.post("/register", providerController.registerProvider);

router.use(authController.protect);

router.get(
  "/me",
  authController.requireRole("provider"),
  providerController.getMyProfile
);
router.put(
  "/me",
  authController.requireRole("provider"),
  providerController.updateMyProfile
);

router.get(
  "/",
  authController.requireRole("admin"),
  providerController.listProviders
);
router.put(
  "/:id/verify",
  authController.requireRole("admin"),
  providerController.verifyProvider
);
router.put(
  "/:id/commission",
  authController.requireRole("admin"),
  providerController.updateProviderCommission
);

module.exports = router;
