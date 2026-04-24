const test = require("node:test");
const assert = require("node:assert/strict");

const emailUtils = require("../utils/email");
const prisma = require("../utils/prisma");

const originalSendEmail = emailUtils.sendEmail;
const originalPrisma = {
  listingCount: prisma.listing.count,
  listingFindMany: prisma.listing.findMany,
  listingFindUnique: prisma.listing.findUnique,
  listingUpdate: prisma.listing.update,
  userFindMany: prisma.user.findMany,
};

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
  prisma.listing.count = originalPrisma.listingCount;
  prisma.listing.findMany = originalPrisma.listingFindMany;
  prisma.listing.findUnique = originalPrisma.listingFindUnique;
  prisma.listing.update = originalPrisma.listingUpdate;
  prisma.user.findMany = originalPrisma.userFindMany;
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

  let countArgs = null;
  let findArgs = null;

  prisma.listing.count = async (args) => {
    countArgs = args;
    return 1;
  };

  prisma.listing.findMany = async (args) => {
    findArgs = args;
    return [
      {
        id: "listing-1",
        name: "Dorm room",
        status: "inactive",
        user: { username: "owner", email: "owner@example.com" },
      },
    ];
  };

  const result = await invokeController(adminController.getInactiveListings, {
    query: { page: "1", limit: "10" },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.total, 1);
  assert.equal(result.body.results, 1);
  assert.deepEqual(countArgs, { where: { status: "inactive" } });
  assert.deepEqual(findArgs.where, { status: "inactive" });
  assert.equal(findArgs.skip, 0);
  assert.equal(findArgs.take, 10);
  assert.deepEqual(findArgs.orderBy, { paymentDeadline: "asc" });
});

test("getInactiveListings combines landlord, location, and date filters", async () => {
  const adminController = loadAdminController();

  let countArgs = null;
  let findArgs = null;

  prisma.user.findMany = async () => [{ id: "user_1" }, { id: "user_2" }];
  prisma.listing.count = async (args) => {
    countArgs = args;
    return 2;
  };
  prisma.listing.findMany = async (args) => {
    findArgs = args;
    return [
      { id: "listing_1", status: "inactive", user: { username: "one", email: "one@example.com" } },
      { id: "listing_2", status: "inactive", user: { username: "two", email: "two@example.com" } },
    ];
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
  assert.deepEqual(countArgs.where.userId, { in: ["user_1", "user_2"] });
  assert.deepEqual(findArgs.where.userId, { in: ["user_1", "user_2"] });
  assert.equal(countArgs.where.status, "inactive");
  assert.equal(findArgs.where.status, "inactive");
  assert.deepEqual(countArgs.where.province, {
    contains: "Harare",
    mode: "insensitive",
  });
  assert.deepEqual(countArgs.where.city, {
    contains: "Avondale",
    mode: "insensitive",
  });
  assert.equal(
    countArgs.where.paymentDeadline.gte.toISOString(),
    "2025-01-01T00:00:00.000Z"
  );
  assert.equal(
    countArgs.where.paymentDeadline.lte.toISOString(),
    "2025-01-31T00:00:00.000Z"
  );
  assert.equal(
    countArgs.where.createdAt.gte.toISOString(),
    "2024-12-01T00:00:00.000Z"
  );
  assert.equal(
    countArgs.where.createdAt.lte.toISOString(),
    "2024-12-31T00:00:00.000Z"
  );
  assert.equal(findArgs.skip, 5);
  assert.equal(findArgs.take, 5);
  assert.deepEqual(findArgs.orderBy, { paymentDeadline: "asc" });
});

test("getInactiveListings returns empty results when landlord search has no matches", async () => {
  const adminController = loadAdminController();
  let listingQueries = 0;

  prisma.user.findMany = async () => [];
  prisma.listing.count = async () => {
    listingQueries += 1;
    return 0;
  };
  prisma.listing.findMany = async () => {
    listingQueries += 1;
    throw new Error("prisma.listing.findMany should not be called");
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

  const updatedIds = [];
  const emailedIds = [];
  const listingsById = {
    "507f1f77bcf86cd799439011": {
      id: "507f1f77bcf86cd799439011",
      name: "Revive me",
      status: "inactive",
      userId: "user_1",
      user: { username: "owner1", email: "owner1@example.com" },
    },
    "507f1f77bcf86cd799439012": {
      id: "507f1f77bcf86cd799439012",
      name: "Already active",
      status: "active",
      userId: "user_2",
      user: { username: "owner2", email: null },
    },
  };

  prisma.listing.findUnique = async ({ where }) => listingsById[where.id] || null;
  prisma.listing.count = async ({ where }) => (where.userId === "user_1" ? 0 : 1);
  prisma.listing.update = async ({ where }) => {
    updatedIds.push(where.id);
    return { id: where.id };
  };
  emailUtils.sendEmail = async ({ to }) => {
    emailedIds.push(to);
    throw new Error("ses down");
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
  assert.deepEqual(updatedIds, ["507f1f77bcf86cd799439011"]);
  assert.deepEqual(emailedIds, ["owner1@example.com"]);
});

test("bulkReviveListings rejects oversized batches", async () => {
  const adminController = loadAdminController();

  let findUniqueCalls = 0;
  prisma.listing.findUnique = async () => {
    findUniqueCalls += 1;
    return null;
  };

  const result = await invokeController(adminController.bulkReviveListings, {
    body: {
      ids: Array.from({ length: 101 }, (_, index) => String(index + 1)),
    },
  });

  assert.ok(result.error);
  assert.equal(result.error.statusCode, 400);
  assert.equal(
    result.error.message,
    "Cannot revive more than 100 listings at once"
  );
  assert.equal(findUniqueCalls, 0);
});
