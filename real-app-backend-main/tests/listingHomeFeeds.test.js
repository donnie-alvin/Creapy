const test = require("node:test");
const assert = require("node:assert/strict");

const listingController = require("../controllers/listingController");
const prisma = require("../utils/prisma");

const originalListing = {
  findMany: prisma.listing.findMany,
  updateMany: prisma.listing.updateMany,
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
      if (err) reject(err);
    });
  });

test.afterEach(() => {
  prisma.listing.findMany = originalListing.findMany;
  prisma.listing.updateMany = originalListing.updateMany;
});

test("getHomeHighlighted returns active listings with default limit", async () => {
  const sample = [
    { id: "1", status: "active" },
    { id: "2", status: "active" },
  ];
  const findCalls = [];

  prisma.listing.updateMany = async () => ({ count: 0 });
  prisma.listing.findMany = async (args) => {
    findCalls.push(args);
    return sample;
  };

  const result = await invokeController(listingController.getHomeHighlighted, {
    query: {},
  });

  assert.equal(findCalls.length, 1);
  assert.deepEqual(findCalls[0], {
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 9,
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.results, 2);
  assert.deepEqual(result.body.data, [
    { id: "1", status: "active", _id: "1", location: { province: "", city: "", addressLine: "", country: "Zimbabwe" } },
    { id: "2", status: "active", _id: "2", location: { province: "", city: "", addressLine: "", country: "Zimbabwe" } },
  ]);
});

test("getHomeHighlighted respects custom limit", async () => {
  let capturedArgs = null;
  prisma.listing.updateMany = async () => ({ count: 0 });

  prisma.listing.findMany = async (args) => {
    capturedArgs = args;
    return [];
  };

  await invokeController(listingController.getHomeHighlighted, {
    query: { limit: "4" },
  });

  assert.equal(capturedArgs.take, 4);
});

test("getHomeGroupedByLocation builds grouped response with limits", async () => {
  let capturedArgs = null;
  prisma.listing.updateMany = async () => ({ count: 0 });

  prisma.listing.findMany = async (args) => {
    capturedArgs = args;
    return [
      {
        id: "a1",
        name: "Alpha",
        province: "Harare",
        imageUrls: ["alpha.jpg"],
        createdAt: new Date("2025-01-02T00:00:00.000Z"),
        status: "active",
      },
      {
        id: "a2",
        name: "Beta",
        province: "Harare",
        imageUrls: [],
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        status: "active",
      },
    ];
  };

  const result = await invokeController(
    listingController.getHomeGroupedByLocation,
    {
      query: { locationsLimit: "3", perLocation: "1" },
    }
  );

  assert.deepEqual(capturedArgs, {
    where: {
      status: "active",
      province: { not: "" },
    },
    orderBy: { createdAt: "desc" },
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.results, 1);
  assert.deepEqual(result.body.data, [
    {
      location: "Harare",
      listings: [
        {
          _id: "a1",
          name: "Alpha",
          monthlyRent: undefined,
          bedrooms: undefined,
          totalRooms: undefined,
          amenities: undefined,
          status: "active",
          studentAccommodation: undefined,
          createdAt: new Date("2025-01-02T00:00:00.000Z"),
          location: "Harare",
          image: "alpha.jpg",
        },
      ],
    },
  ]);
});

test("getListings applies province filter using Prisma-compatible conditions", async () => {
  let capturedArgs = null;
  prisma.listing.updateMany = async () => ({ count: 0 });

  prisma.listing.findMany = async (args) => {
    capturedArgs = args;
    return [];
  };

  await invokeController(listingController.getListings, {
    query: { province: "Harare" },
  });

  assert.equal(capturedArgs.where.status, "active");
  assert.ok(Array.isArray(capturedArgs.where.AND));
  assert.deepEqual(capturedArgs.where.AND, [
    {
      province: { contains: "Harare", mode: "insensitive" },
    },
  ]);
});
