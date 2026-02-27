const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const paymentController = require("../controllers/paymentController");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");

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

test("listing routes keep browse/view public and publish landlord-only", async () => {
  const file = fs.readFileSync(
    path.join(__dirname, "..", "routes", "listingRoutes.js"),
    "utf8"
  );

  assert.ok(file.includes('router.get("/", listingController.getListings);'));
  assert.ok(file.includes('router.get("/:id", listingController.getListing);'));
  assert.ok(file.includes('authController.requireRole("landlord")'));
  assert.ok(file.includes("listingController.createListing"));
  assert.ok(file.includes("listingController.updateListing"));

  const publicListIndex = file.indexOf('router.get("/", listingController.getListings);');
  const publicDetailIndex = file.indexOf('router.get("/:id", listingController.getListing);');
  const protectIndex = file.indexOf("router.use(authController.protect);");
  assert.ok(publicListIndex > -1 && publicListIndex < protectIndex);
  assert.ok(publicDetailIndex > -1 && publicDetailIndex < protectIndex);
});

test("tenant saved searches no longer require premium middleware", async () => {
  const file = fs.readFileSync(
    path.join(__dirname, "..", "routes", "savedSearchRoutes.js"),
    "utf8"
  );

  assert.ok(!file.includes("requirePremium"));
});

test("landlord payment success marks landlord as paid", async () => {
  const originalCreate = Payment.create;
  const originalUpdate = User.findByIdAndUpdate;

  let capturedUpdate = null;

  Payment.create = async () => ({ _id: "pay_1", status: "success" });
  User.findByIdAndUpdate = async (id, update) => {
    capturedUpdate = update;
    return {
      _id: id,
      role: "landlord",
      landlordPlan: "pro",
      password: "hidden",
    };
  };

  const result = await invokeController(paymentController.createPremiumPayment, {
    user: { _id: "u_1", role: "landlord" },
    body: { amount: 0, method: "mock" },
  });

  Payment.create = originalCreate;
  User.findByIdAndUpdate = originalUpdate;

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(capturedUpdate.landlordPlan, "pro");
  assert.ok(capturedUpdate.landlordPaidUntil);
});

test("tenant payment attempt is blocked", async () => {
  const result = await invokeController(paymentController.createPremiumPayment, {
    user: { _id: "u_2", role: "tenant" },
    body: { amount: 0, method: "mock" },
  });

  assert.ok(result.error);
  assert.equal(result.error.statusCode, 403);
  assert.equal(
    result.error.message,
    "Only landlords can subscribe to publish listings"
  );
});
