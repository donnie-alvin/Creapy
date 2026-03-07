const express = require("express");
// Custom imports
const authController = require("../controllers/authController");
const listingController = require("../controllers/listingController");
const validate = require("../middleware/validate");
const { createListingValidators } = require("../middleware/listingValidators");

const router = express.Router();

router.get("/", authController.optionalAuth, listingController.getListings);
router.get("/get", authController.optionalAuth, listingController.getListings);
router.get("/home/highlighted", authController.optionalAuth, listingController.getHomeHighlighted);
router.get(
  "/home/grouped-by-location",
  authController.optionalAuth,
  listingController.getHomeGroupedByLocation
);
router.get("/listing/:id", authController.optionalAuth, listingController.getListing);
router.get("/:id", listingController.getListing);

// PROTECTED

router.use(authController.protect);

// LANDLORD ONLY
router.post(
  "/",
  authController.requireRole("landlord"),
  ...createListingValidators,
  validate,
  listingController.createListing
);

router.get(
  "/user/:id",
  authController.requireRole("landlord"),
  listingController.getUsersListings
);

router.delete(
  "/:id",
  authController.requireRole("landlord"),
  listingController.deleteListing
);

router.put(
  "/:id",
  authController.requireRole("landlord"),
  listingController.updateListing
);
module.exports = router;
