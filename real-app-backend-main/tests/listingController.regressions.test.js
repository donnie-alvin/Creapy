const test = require("node:test");
const assert = require("node:assert/strict");

const listingController = require("../controllers/listingController");
const prisma = require("../utils/prisma");

const originalListing = {
  ...prisma.listing,
};

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

test.afterEach(() => {
  prisma.listing.findUnique = originalListing.findUnique;
  prisma.listing.findMany = originalListing.findMany;
  prisma.listing.update = originalListing.update;
  prisma.listing.updateMany = originalListing.updateMany;
});

test("getListing hides pending payment listings from non-owners", async () => {
  prisma.listing.findUnique = async () => ({
    id: "listing_1",
    userId: "owner_1",
    status: "pending_payment",
    province: "Harare",
    city: "Avondale",
    addressLine: "12 King George Road",
  });

  const result = await invokeController(listingController.getListing, {
    params: { id: "listing_1" },
    user: { id: "tenant_1", role: "tenant", isPremium: false },
  });

  assert.equal(result.error.statusCode, 404);
  assert.equal(result.error.message, "No listing found with that ID");
});

test("getListing hides early access listings from non-premium users and preserves location shape", async () => {
  prisma.listing.findUnique = async () => ({
    id: "listing_2",
    userId: "owner_1",
    status: "early_access",
    province: "Harare",
    city: "Borrowdale",
    addressLine: "1 Samora Machel Ave",
  });

  const blocked = await invokeController(listingController.getListing, {
    params: { id: "listing_2" },
    user: { id: "tenant_1", role: "tenant" },
  });

  assert.equal(blocked.error.statusCode, 404);

  const allowed = await invokeController(listingController.getListing, {
    params: { id: "listing_2" },
    user: {
      id: "tenant_2",
      role: "tenant",
      premiumExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  });

  assert.equal(allowed.statusCode, 200);
  assert.deepEqual(allowed.body.data.location, {
    province: "Harare",
    city: "Borrowdale",
    addressLine: "1 Samora Machel Ave",
    country: "Zimbabwe",
  });
  assert.equal(allowed.body.data.province, "Harare");
});

test("updateListing rejects lifecycle-managed fields", async () => {
  let updateCalled = false;

  prisma.listing.findUnique = async () => ({
    id: "listing_3",
    userId: "owner_1",
  });
  prisma.listing.update = async () => {
    updateCalled = true;
    return {};
  };

  const result = await invokeController(listingController.updateListing, {
    params: { id: "listing_3" },
    user: { id: "owner_1" },
    body: { status: "inactive", name: "Renamed listing" },
  });

  assert.equal(result.error.statusCode, 400);
  assert.equal(
    result.error.message,
    "Listing lifecycle fields cannot be updated from this endpoint."
  );
  assert.equal(updateCalled, false);
});

test("transitionListingToPendingPayment enforces active status and valid payment window", async () => {
  prisma.listing.findUnique = async () => ({
    id: "listing_4",
    userId: "owner_1",
    status: "inactive",
    paymentDeadline: new Date(Date.now() + 60 * 60 * 1000),
  });

  const inactiveResult = await invokeController(
    listingController.transitionListingToPendingPayment,
    {
      params: { id: "listing_4" },
      user: { id: "owner_1" },
    }
  );

  assert.equal(inactiveResult.error.statusCode, 400);
  assert.equal(
    inactiveResult.error.message,
    "Only active listings can be transitioned to pending payment."
  );

  prisma.listing.findUnique = async () => ({
    id: "listing_4",
    userId: "owner_1",
    status: "active",
    paymentDeadline: new Date(Date.now() - 60 * 60 * 1000),
  });

  const expiredResult = await invokeController(
    listingController.transitionListingToPendingPayment,
    {
      params: { id: "listing_4" },
      user: { id: "owner_1" },
    }
  );

  assert.equal(expiredResult.error.statusCode, 400);
  assert.equal(
    expiredResult.error.message,
    "Only listings still within the payment window can be transitioned to pending payment."
  );
});

test("listing responses rebuild the legacy location object from flat columns", async () => {
  prisma.listing.updateMany = async () => ({ count: 0 });
  prisma.listing.findMany = async () => [
    {
      id: "listing_5",
      province: "Bulawayo",
      city: "Suburbs",
      addressLine: "22 Main Street",
      status: "active",
    },
  ];

  const result = await invokeController(listingController.getListings, {
    query: {},
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body.data[0].location, {
    province: "Bulawayo",
    city: "Suburbs",
    addressLine: "22 Main Street",
    country: "Zimbabwe",
  });
  assert.equal(result.body.data[0].province, "Bulawayo");
});
