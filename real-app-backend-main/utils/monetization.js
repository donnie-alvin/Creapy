const MONETIZATION_MODE = process.env.MONETIZATION_MODE || "LANDLORD_PAID";

const isPremiumTenant = (user) => {
  return user.premiumExpiry && new Date(user.premiumExpiry) > new Date();
};

module.exports = {
  MONETIZATION_MODE,
  isPremiumTenant,
};
