/**
 * Payment Provider Abstraction
 *
 * This module defines the contract for payment providers and the factory to retrieve them.
 * All payment providers must implement the following methods:
 *
 * @interface PaymentProvider
 * @method initiateListingFee(listing, landlord)
 *   - Initiates a listing fee payment
 *   - Returns: { transactionRef, instructions }
 *
 * @method initiatePremiumSubscription(user)
 *   - Initiates a premium subscription payment for a tenant
 *   - Returns: { transactionRef, instructions }
 *
 * @method verifyWebhook(formFields)
 *   - Verifies and processes a webhook event from the payment provider
 *   - Returns: { valid: Boolean, transactionRef, status }
 */

const MockProvider = require('./providers/mockProvider');
const PaynowProvider = require('./providers/paynowProvider');

/**
 * Factory function to get the appropriate payment provider
 * @returns {PaymentProvider} The configured payment provider instance
 */
const getProvider = () => {
  const paymentProvider = process.env.PAYMENT_PROVIDER || 'mock';
  
  if (paymentProvider === 'paynow') {
    return PaynowProvider;
  }
  
  // Default to mock provider
  return MockProvider;
};

module.exports = {
  getProvider,
};
