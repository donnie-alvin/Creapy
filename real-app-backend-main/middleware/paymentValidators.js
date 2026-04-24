const { body } = require("express-validator");

const listingFeeValidators = [
  body("listingId")
    .notEmpty()
    .withMessage("listingId is required")
    .isString()
    .withMessage("listingId must be a valid listing ID")
    .bail()
    .custom((value) => value.trim().length > 0)
    .withMessage("listingId must be a valid listing ID"),
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
