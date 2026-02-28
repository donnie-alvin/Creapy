const { body } = require("express-validator");
const mongoose = require("mongoose");

const listingFeeValidators = [
  body("listingId")
    .notEmpty()
    .withMessage("listingId is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("listingId must be a valid ObjectId"),
  body("phone")
    .notEmpty()
    .withMessage("phone is required")
    .isString()
    .withMessage("phone must be a string"),
];

const tenantPremiumValidators = [
  body("phone")
    .notEmpty()
    .withMessage("phone is required")
    .isString()
    .withMessage("phone must be a string"),
];

module.exports = {
  listingFeeValidators,
  tenantPremiumValidators,
};
