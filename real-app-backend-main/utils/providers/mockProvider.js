/**
 * Mock Payment Provider
 *
 * This provider simulates payment processing for development and testing.
 * All transactions are immediately marked as successful.
 */

const mockProvider = {
  /**
   * Initiates a mock listing fee payment
   * @param {object} listing - Listing model
   * @param {object} landlord - Landlord user
   * @returns {object} Payment initiation response
   */
  initiateListingFee: async (listing, landlord) => {
    const transactionRef = `mock-${Date.now()}`;

    return {
      transactionRef,
      instructions: "Mock payment — approved immediately",
    };
  },

  /**
   * Initiates a mock premium subscription payment
   * @param {object} user - Tenant user
   * @returns {object} Payment initiation response
   */
  initiatePremiumSubscription: async (user) => {
    const transactionRef = `mock-${Date.now()}`;

    return {
      transactionRef,
      instructions: "Mock payment — approved immediately",
    };
  },

  /**
   * Verifies a mock webhook (always succeeds for testing)
   * @param {object} formFields - Webhook payload
   * @returns {object} Webhook verification response
   */
  verifyWebhook: async (formFields) => ({
    valid: true,
    transactionRef: formFields.reference,
    status: "paid",
  }),
};

module.exports = mockProvider;
