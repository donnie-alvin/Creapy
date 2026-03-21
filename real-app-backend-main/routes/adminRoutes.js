const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(
  authController.protect,
  authController.requireRole("admin")
);

// Future admin route handlers (T2) will be registered here.

module.exports = router;
