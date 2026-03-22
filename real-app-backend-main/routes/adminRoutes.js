const express = require("express");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(
  authController.protect,
  authController.requireRole("admin")
);

router.get(
  "/listings/inactive",
  adminController.getInactiveListings
);
router.post(
  "/listings/bulk-revive",
  adminController.bulkReviveListings
);

module.exports = router;
