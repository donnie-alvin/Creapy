const express = require("express");
const stayController = require("../controllers/stayController");

const router = express.Router();

router.get("/", stayController.searchStays);
router.get("/:providerId", stayController.getProviderStays);

module.exports = router;
