const express = require("express");
const authController = require("../controllers/authController");
const savedSearchController = require("../controllers/savedSearchController");

const router = express.Router();

// All saved searches require auth
router.use(authController.protect);

// Tenant only
router.use(authController.requireRole("tenant"));

router.post("/", savedSearchController.createSavedSearch);
router.get("/mine", savedSearchController.getMySavedSearches);
router.delete("/:id", savedSearchController.deleteSavedSearch);

module.exports = router;
