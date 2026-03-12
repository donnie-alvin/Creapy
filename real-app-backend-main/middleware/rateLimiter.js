const rateLimit = require("express-rate-limit");

const shouldBypassRateLimit = (req) => {
  const configuredSeedKey = process.env.SEED_API_KEY;
  if (!configuredSeedKey) {
    return false;
  }

  return req.get("x-seed-api-key") === configuredSeedKey;
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: shouldBypassRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests, please try again later.",
  },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: shouldBypassRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many payment requests, please try again later.",
  },
});

module.exports = {
  globalLimiter,
  paymentLimiter,
};
