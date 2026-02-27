/**
 * Paynow Payment Provider
 *
 * This provider integrates with the Paynow payment gateway for EcoCash and card payments.
 * It handles payment initiation and webhook verification using the Paynow SDK.
 */

const Paynow = require('paynow');
const AppError = require('../appError');

// Initialize Paynow with credentials from environment
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID,
  process.env.PAYNOW_INTEGRATION_KEY
);

// Set result and return URLs for payment callbacks
paynow.resultUrl = process.env.PAYNOW_RESULT_URL;
paynow.returnUrl = process.env.PAYNOW_RETURN_URL;

const parseConfiguredAmount = (envKey) => {
  const rawValue = process.env[envKey];
  const amount = Number.parseFloat(rawValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(`Invalid or missing ${envKey} configuration`, 500);
  }

  return amount;
};

const validatePayerContact = (payerType, payer) => {
  if (!payer?.email) {
    throw new AppError(`Missing ${payerType} email for Paynow transaction`, 400);
  }

  if (!payer?.phone) {
    throw new AppError(`Missing ${payerType} phone for Paynow transaction`, 400);
  }
};

const paynowProvider = {
  /**
   * Initiates a Paynow listing fee payment
   * @param {object} listing - Listing model
   * @param {object} landlord - Landlord user
   * @returns {object} Payment initiation response
   */
  initiateListingFee: async (listing, landlord) => {
    const amount = parseConfiguredAmount('LISTING_FEE_AMOUNT');
    validatePayerContact('landlord', landlord);
    const phone = landlord.phone;

    try {
      const payment = paynow.createPayment(
        `listing-${listing._id}`,
        landlord.email
      );

      payment.add('Listing Publication Fee', amount);

      const response = await paynow.sendMobile(payment, phone, 'ecocash');

      if (!response.success) {
        throw new AppError(response.error || 'Failed to initiate Paynow payment', 502);
      }

      return {
        transactionRef: response.reference,
        instructions: response.instructions,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(error.message || 'Paynow payment initiation error', 502);
    }
  },

  /**
   * Initiates a Paynow premium subscription payment
   * @param {object} user - Tenant user
   * @returns {object} Payment initiation response
   */
  initiatePremiumSubscription: async (user) => {
    const amount = parseConfiguredAmount('TENANT_PREMIUM_AMOUNT');
    validatePayerContact('user', user);
    const phone = user.phone;

    try {
      const payment = paynow.createPayment(
        `premium-${user._id}-${Date.now()}`,
        user.email
      );

      payment.add('Tenant Premium Subscription', amount);

      const response = await paynow.sendMobile(payment, phone, 'ecocash');

      if (!response.success) {
        throw new AppError(response.error || 'Failed to initiate Paynow payment', 502);
      }

      return {
        transactionRef: response.reference,
        instructions: response.instructions,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(error.message || 'Paynow payment initiation error', 502);
    }
  },

  /**
   * Verifies a Paynow webhook/payment status
   * Checks webhook signature and validates payment completion
   * @param {object} formFields - Webhook payload or payment status data
   * @returns {object} Webhook verification response
   */
  verifyWebhook: async (formFields) => {
    const valid = paynow.verifyHash(formFields);

    return {
      valid,
      transactionRef: formFields.reference,
      status: formFields.status,
    };
  },
};

module.exports = paynowProvider;
