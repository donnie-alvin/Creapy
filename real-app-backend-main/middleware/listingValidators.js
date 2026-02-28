const { body } = require("express-validator");

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const isPositiveNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

const createListingValidators = [
  body("name").notEmpty().withMessage("name is required"),
  body("description").notEmpty().withMessage("description is required"),
  body("address").notEmpty().withMessage("address is required"),
  body("location").notEmpty().withMessage("location is required"),
  body("monthlyRent")
    .if((value) => hasValue(value))
    .isFloat({ gt: 0 })
    .withMessage("monthlyRent must be a number greater than 0"),
  body("regularPrice")
    .if((value) => hasValue(value))
    .isFloat({ gt: 0 })
    .withMessage("regularPrice must be a number greater than 0"),
  body().custom((value, { req }) => {
    const monthlyRent = req.body.monthlyRent;
    const regularPrice = req.body.regularPrice;
    const monthlyRentValid =
      hasValue(monthlyRent) && isPositiveNumber(monthlyRent);
    const regularPriceValid =
      hasValue(regularPrice) && isPositiveNumber(regularPrice);

    if (!monthlyRentValid && !regularPriceValid) {
      throw new Error("monthlyRent or regularPrice must be a number greater than 0");
    }

    return true;
  }),
  body("bedrooms")
    .isInt({ min: 1 })
    .withMessage("bedrooms must be an integer greater than or equal to 1"),
  body("bathrooms")
    .isInt({ min: 1 })
    .withMessage("bathrooms must be an integer greater than or equal to 1"),
];

module.exports = {
  createListingValidators,
};
