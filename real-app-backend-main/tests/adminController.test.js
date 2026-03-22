const test = require("node:test");
const assert = require("node:assert/strict");

const emailUtils = require("../utils/email");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");

const originalSendEmail = emailUtils.sendEmail;
const originalCountDocuments = Listing.countDocuments;
const originalFind = Listing.find;
const originalFindById = Listing.findById;
const originalUserFind = User.find;

const loadAdminController = () => {
  delete require.cache[require.resolve("../controllers/adminController")];
  return require("../controllers/adminController");
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
  emailUtils.sendEmail = originalSendEmail;
  Listing.countDocuments = originalCountDocuments;
  Listing.find = originalFind;
  Listing.findById = originalFindById;
  User.find = originalUserFind;
});

test("admin routes expose inactive listings and bulk revive endpoints", async () => {
  const adminRoutes = require("../routes/adminRoutes");
  const routeLayers = adminRoutes.stack.filter((layer) => layer.route);

  const inactiveLayer = routeLayers.find(
    (layer) =>
      layer.route.path === "/listings/inactive" && layer.route.methods.get
  );
  const reviveLayer = routeLayers.find(
    (layer) =>
      layer.route.path === "/listings/bulk-revive" && layer.route.methods.post
  );

  assert.ok(inactiveLayer);
  assert.ok(reviveLayer);
});

test("getInactiveListings returns paginated inactive listings", async () => {
  const adminController = loadAdminController();

  let countFilter = null;
  let findFilter = null;

  Listing.countDocuments = async (filter) => {
    countFilter = filter;
    return 1;
  };

  Listing.find = (filter) => {
    findFilter = filter;

    return {
      populate() {
        return this;
      },
      skip() {
        return this;
      },
      limit() {
        return this;
      },
      sort() {
        return Promise.resolve([
          {
            _id: "507f1f77bcf86cd799439011",
            name: "Dorm room",
            status: "inactive",
          },
        ]);
      },
    };
  };

  const result = await invokeController(adminController.getInactiveListings, {
    query: { page: "1", limit: "10" },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.total, 1);
  assert.equal(result.body.results, 1);
  assert.deepEqual(countFilter, { status: "inactive" });
  assert.deepEqual(findFilter, { status: "inactive" });
});

test("getInactiveListings combines landlord, location, and date filters", async () => {
  const adminController = loadAdminController();

  let countFilter = null;
  let findFilter = null;
  let skipValue = null;
  let limitValue = null;
  let sortValue = null;

  User.find = async () => [{ _id: "user_1" }, { _id: "user_2" }];
  Listing.countDocuments = async (filter) => {
    countFilter = filter;
    return 2;
  };
  Listing.find = (filter) => {
    findFilter = filter;

    return {
      populate() {
        return this;
      },
      skip(value) {
        skipValue = value;
        return this;
      },
      limit(value) {
        limitValue = value;
        return this;
      },
      sort(value) {
        sortValue = value;
        return Promise.resolve([
          { _id: "listing_1", status: "inactive" },
          { _id: "listing_2", status: "inactive" },
        ]);
      },
    };
  };

  const result = await invokeController(adminController.getInactiveListings, {
    query: {
      landlord: "owner",
      province: "Harare",
      city: "Avondale",
      expiredFrom: "2025-01-01T00:00:00.000Z",
      expiredTo: "2025-01-31T00:00:00.000Z",
      uploadedFrom: "2024-12-01T00:00:00.000Z",
      uploadedTo: "2024-12-31T00:00:00.000Z",
      page: "2",
      limit: "5",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.total, 2);
  assert.equal(result.body.results, 2);
  assert.deepEqual(countFilter.user, { $in: ["user_1", "user_2"] });
  assert.deepEqual(findFilter.user, { $in: ["user_1", "user_2"] });
  assert.equal(countFilter.status, "inactive");
  assert.equal(findFilter.status, "inactive");
  assert.equal(countFilter["location.province"].source, "Harare");
  assert.equal(countFilter["location.province"].flags, "i");
  assert.equal(countFilter["location.city"].source, "Avondale");
  assert.equal(countFilter["location.city"].flags, "i");
  assert.equal(
    countFilter.paymentDeadline.$gte.toISOString(),
    "2025-01-01T00:00:00.000Z"
  );
  assert.equal(
    countFilter.paymentDeadline.$lte.toISOString(),
    "2025-01-31T00:00:00.000Z"
  );
  assert.equal(
    countFilter.createdAt.$gte.toISOString(),
    "2024-12-01T00:00:00.000Z"
  );
  assert.equal(
    countFilter.createdAt.$lte.toISOString(),
    "2024-12-31T00:00:00.000Z"
  );
  assert.equal(skipValue, 5);
  assert.equal(limitValue, 5);
  assert.deepEqual(sortValue, { paymentDeadline: 1 });
});

test("getInactiveListings returns empty results when landlord search has no matches", async () => {
  const adminController = loadAdminController();
  let listingQueries = 0;

  User.find = async () => [];
  Listing.countDocuments = async () => {
    listingQueries += 1;
    return 0;
  };
  Listing.find = () => {
    listingQueries += 1;
    throw new Error("Listing.find should not be called");
  };

  const result = await invokeController(adminController.getInactiveListings, {
    query: { landlord: "missing-owner" },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "success",
    total: 0,
    results: 0,
    data: [],
  });
  assert.equal(listingQueries, 0);
});

test("bulkReviveListings revives inactive listings, ignores email failure, and reports failures", async () => {
  const adminController = loadAdminController();

  const savedIds = [];
  const emailedIds = [];
  const listingsById = {
    "507f1f77bcf86cd799439011": {
      _id: "507f1f77bcf86cd799439011",
      name: "Revive me",
      status: "inactive",
      user: { _id: "user_1", email: "owner1@example.com" },
      async save() {
        savedIds.push(this._id);
      },
    },
    "507f1f77bcf86cd799439012": {
      _id: "507f1f77bcf86cd799439012",
      name: "Already active",
      status: "active",
      user: { _id: "user_2" },
      async save() {
        savedIds.push(this._id);
      },
    },
  };

  Listing.findById = (id) => ({
    populate: async () => listingsById[id] || null,
  });

  Listing.countDocuments = async ({ user }) => (user === "user_1" ? 0 : 1);
  emailUtils.sendEmail = async ({ to }) => {
    emailedIds.push(to);
    throw new Error("smtp down");
  };

  const result = await invokeController(adminController.bulkReviveListings, {
    body: {
      ids: [
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
        "not-an-object-id",
      ],
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.deepEqual(result.body.revived, ["507f1f77bcf86cd799439011"]);
  assert.deepEqual(result.body.failed, [
    {
      id: "507f1f77bcf86cd799439012",
      reason: "Listing is not inactive",
    },
    {
      id: "not-an-object-id",
      reason: "Listing not found",
    },
  ]);
  assert.deepEqual(savedIds, ["507f1f77bcf86cd799439011"]);
  assert.deepEqual(emailedIds, ["owner1@example.com"]);
});
