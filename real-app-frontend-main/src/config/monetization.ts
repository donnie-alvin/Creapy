export type MonetizationMode = "LANDLORD_PAID" | "TENANT_PAID";

const rawMode =
  process.env.REACT_APP_MONETIZATION_MODE ||
  process.env.MONETIZATION_MODE ||
  "LANDLORD_PAID";

export const MONETIZATION_MODE: MonetizationMode =
  rawMode === "TENANT_PAID" ? "TENANT_PAID" : "LANDLORD_PAID";

export const isPremiumTenant = (user: any): boolean => {
  return user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();
};
