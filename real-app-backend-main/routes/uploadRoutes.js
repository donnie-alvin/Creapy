const express = require('express');
const authController = require('../controllers/authController');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

router.use(authController.protect);

// signed upload url
router.get('/r2-sign', uploadController.getSignedUploadUrl);

module.exports = router;
