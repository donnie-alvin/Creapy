const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const paymentController = require("../controllers/paymentController");
const webhookController = require("../controllers/webhookController");
const listingController = require("../controllers/listingController");
const Payment = require("../models/paymentModel");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");
const { isPremiumTenant } = require("../utils/monetization");

const invokeController = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve({ statusCode: this.statusCode, body: this.body });
      },
    };

    handler(req, res, (err) => {
      if (err) {
        resolve({ error: err });
      } else {
        reject(new Error("Expected controller to resolve or error"));
      }
    });
  });

const invokeWebhookHandler = (handler, req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve({ statusCode: this.statusCode, body: this.body });
      },
    };

    handler(req, res);
  });

test("listing routes keep browse/view public and publish landlord-only", async () => {
  const listingRoutes = require("../routes/listingRoutes");
  const authController = require("../controllers/authController");

  const stack = listingRoutes.stack;
  const routeLayers = stack.filter((layer) => layer.route);

  const publicListLayer = routeLayers.find(
    (layer) => layer.route.path === "/" && layer.route.methods.get
  );
  const publicDetailLayer = routeLayers.find(
    (layer) => layer.route.path === "/listing/:id" && layer.route.methods.get
  );
  const publicLegacyLayer = routeLayers.find(
    (layer) => layer.route.path === "/:id" && layer.route.methods.get
  );
  const createLayer = routeLayers.find(
    (layer) => layer.route.path === "/" && layer.route.methods.post
  );
  const updateLayer = routeLayers.find(
    (layer) => layer.route.path === "/:id" && layer.route.methods.put
  );
  const protectIndex = stack.findIndex(
    (layer) => layer.handle === authController.protect
  );

  assert.ok(publicListLayer);
  assert.ok(publicDetailLayer);
  assert.ok(publicLegacyLayer);
  assert.ok(createLayer);
  assert.ok(updateLayer);
  assert.ok(protectIndex > -1);

  const publicListHandlers = publicListLayer.route.stack.map((layer) => layer.handle);
  const publicDetailHandlers = publicDetailLayer.route.stack.map(
    (layer) => layer.handle
  );

  assert.ok(publicListHandlers.includes(authController.optionalAuth));
  assert.ok(publicDetailHandlers.includes(authController.optionalAuth));

  const publicListIndex = stack.indexOf(publicListLayer);
  const publicDetailIndex = stack.indexOf(publicDetailLayer);
  const createIndex = stack.indexOf(createLayer);

  assert.ok(publicListIndex > -1 && publicListIndex < protectIndex);
  assert.ok(publicDetailIndex > -1 && publicDetailIndex < protectIndex);
  assert.ok(createIndex > -1 && protectIndex < createIndex);
});

test("tenant saved searches no longer require premium middleware", async () => {
  const file = fs.readFileSync(
    path.join(__dirname, "..", "routes", "savedSearchRoutes.js"),
    "utf8"
  );

  assert.ok(!file.includes("requirePremium"));
});

test("landlord can initiate listing fee payment", async () => {
  const originalCreate = Payment.create;
  const originalFindById = Listing.findById;

  let capturedPayment = null;

  Payment.create = async (data) => {
    capturedPayment = data;
    return { _id: "pay_1", ...data, status: "pending" };
  };

  Listing.findById = async () => ({
    _id: "listing_1",
    user: "u_1",
    status: "pending_payment",
  });

  const result = await invokeController(paymentController.initiateListingFee, {
    user: {
      _id: "u_1",
      toObject: () => ({ _id: "u_1", email: "test@example.com", phone: "256700000000" }),
    },
    body: { listingId: "listing_1", phone: "256700000000" },
  });

  Payment.create = originalCreate;
  Listing.findById = originalFindById;

  assert.equal(result.statusCode, 201);
  assert.equal(result.body.status, "success");
  assert.ok(result.body.data.transactionRef);
  assert.equal(capturedPayment.type, "listing_fee");
  assert.equal(capturedPayment.status, "pending");
});

test("tenant can initiate premium subscription payment", async () => {
  const originalCreate = Payment.create;

  let capturedPayment = null;

  Payment.create = async (data) => {
    capturedPayment = data;
    return { _id: "pay_2", ...data, status: "pending" };
  };

  const result = await invokeController(paymentController.initiateTenantPremium, {
    user: {
      _id: "u_2",
      toObject: () => ({ _id: "u_2", email: "tenant@example.com", phone: "256700000001" }),
    },
    body: { phone: "256700000001" },
  });

  Payment.create = originalCreate;

  assert.equal(result.statusCode, 201);
  assert.equal(result.body.status, "success");
  assert.ok(result.body.data.transactionRef);
  assert.equal(capturedPayment.type, "premium_subscription");
  assert.equal(capturedPayment.status, "pending");
});

test("webhook ignores payments with invalid hash", async () => {
  const paymentProvider = require("../utils/paymentProvider");
  const provider = paymentProvider.getProvider();
  const originalVerifyWebhook = provider.verifyWebhook;
  provider.verifyWebhook = async () => ({ valid: false, transactionRef: "tx_1" });

  const result = await invokeWebhookHandler(webhookController.handlePaynowWebhook, {
    body: { reference: "tx_1", status: "paid" },
  });

  provider.verifyWebhook = originalVerifyWebhook;

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "ignored");
  assert.equal(result.body.reason, "invalid hash");
});

test("webhook marks failed payments as failed without granting access", async () => {
  const paymentProvider = require("../utils/paymentProvider");
  const provider = paymentProvider.getProvider();
  const originalVerifyWebhook = provider.verifyWebhook;
  const originalFindOneAndUpdate = Payment.findOneAndUpdate;

  let updateCall = null;

  provider.verifyWebhook = async () => ({
    valid: true,
    transactionRef: "tx_failed",
    status: "failed",
  });

  Payment.findOneAndUpdate = async (filter, update) => {
    updateCall = { filter, update };
    return { _id: "pay_3", transactionRef: "tx_failed", status: "failed" };
  };

  const result = await invokeWebhookHandler(webhookController.handlePaynowWebhook, {
    body: { reference: "tx_failed", status: "failed" },
  });

  provider.verifyWebhook = originalVerifyWebhook;
  Payment.findOneAndUpdate = originalFindOneAndUpdate;

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "ok");
  assert.equal(updateCall.update.status, "failed");
  assert.equal(updateCall.update.webhookVerified, undefined);
});

test("isPremiumTenant returns true only for active premium expiry", () => {
  assert.equal(
    isPremiumTenant({ premiumExpiry: new Date(Date.now() + 86400000) }),
    true
  );
  assert.equal(Boolean(isPremiumTenant({ premiumExpiry: null })), false);
  assert.equal(
    isPremiumTenant({ premiumExpiry: new Date(Date.now() - 1000) }),
    false
  );
});

test("webhook idempotency returns ok on duplicate webhook payloads", async () => {
  const paymentProvider = require("../utils/paymentProvider");
  const provider = paymentProvider.getProvider();
  const originalVerifyWebhook = provider.verifyWebhook;
  const originalFindOneAndUpdate = Payment.findOneAndUpdate;
  const originalListingUpdate = Listing.findByIdAndUpdate;
  const originalUserFindById = User.findById;
  const originalUserUpdate = User.findByIdAndUpdate;

  provider.verifyWebhook = async () => ({
    valid: true,
    transactionRef: "tx_idem",
    status: "paid",
  });

  let claimCalls = 0;
  const claimArgs = [];
  Payment.findOneAndUpdate = async (filter, update) => {
    claimCalls += 1;
    claimArgs.push({ filter, update });
    if (claimCalls === 1) {
      return {
        _id: "pay_idem",
        webhookVerified: true,
        status: "success",
        type: "noop",
      };
    }
    return null;
  };
  Listing.findByIdAndUpdate = async () => {
    throw new Error("unexpected listing side effect");
  };
  User.findById = async () => {
    throw new Error("unexpected user lookup");
  };
  User.findByIdAndUpdate = async () => {
    throw new Error("unexpected user update");
  };

  const req = {
    body: { reference: "tx_idem", status: "paid" },
  };

  const first = await invokeWebhookHandler(webhookController.handlePaynowWebhook, req);
  const second = await invokeWebhookHandler(webhookController.handlePaynowWebhook, req);

  provider.verifyWebhook = originalVerifyWebhook;
  Payment.findOneAndUpdate = originalFindOneAndUpdate;
  Listing.findByIdAndUpdate = originalListingUpdate;
  User.findById = originalUserFindById;
  User.findByIdAndUpdate = originalUserUpdate;

  assert.equal(first.statusCode, 200);
  assert.equal(first.body.status, "ok");
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.status, "ok");
  assert.equal(second.body.reason, "already processed");
  assert.equal(claimCalls, 2);
  assert.equal(claimArgs.length, 2);
  claimArgs.forEach(({ filter, update }) => {
    assert.equal(filter.transactionRef, "tx_idem");
    assert.equal(filter.webhookVerified, false);
    assert.deepEqual(update, { $set: { webhookVerified: true, status: "success" } });
  });
});

test("getListings applies early_access visibility for premium users only", async () => {
  const originalUpdateMany = Listing.updateMany;
  const originalFind = Listing.find;

  const capturedFilters = [];
  Listing.updateMany = async () => ({ modifiedCount: 0 });
  Listing.find = (filter) => {
    capturedFilters.push(filter);
    return {
      skip: () => ({
        limit: () => ({
          sort: async () => [],
        }),
      }),
    };
  };

  await invokeController(listingController.getListings, {
    query: {},
    user: { premiumExpiry: new Date(Date.now() + 86400000) },
  });

  await invokeController(listingController.getListings, {
    query: {},
  });

  Listing.updateMany = originalUpdateMany;
  Listing.find = originalFind;

  assert.deepEqual(capturedFilters[0].status, { $in: ["active", "early_access"] });
  assert.equal(capturedFilters[1].status, "active");
});

test("promoteExpiredEarlyAccess transitions expired listings to active", async () => {
  const originalUpdateMany = Listing.updateMany;
  const originalFind = Listing.find;

  const updateCalls = [];
  Listing.updateMany = async (filter, update) => {
    updateCalls.push({ filter, update });
    return { modifiedCount: 1 };
  };
  Listing.find = () => ({
    skip: () => ({
      limit: () => ({
        sort: async () => [],
      }),
    }),
  });

  await invokeController(listingController.getListings, { query: {} });

  Listing.updateMany = originalUpdateMany;
  Listing.find = originalFind;

  assert.equal(updateCalls.length > 0, true);
  assert.deepEqual(updateCalls[0].filter.status, "early_access");
  assert.equal(updateCalls[0].filter.earlyAccessUntil.$lt instanceof Date, true);
  assert.deepEqual(updateCalls[0].update, { $set: { status: "active" } });
});
