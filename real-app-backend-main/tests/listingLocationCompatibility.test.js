const test = require("node:test");
const assert = require("node:assert/strict");

const listingController = require("../controllers/listingController");
const Listing = require("../models/listingModel");

const originalFind = Listing.find;
const originalAggregate = Listing.aggregate;
const originalUpdateMany = Listing.updateMany;

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
  Listing.find = originalFind;
  Listing.aggregate = originalAggregate;
  Listing.updateMany = originalUpdateMany;
});

test("matchesSavedSearch matches city, province, and address line for canonical locations", () => {
  const { matchesSavedSearch } = listingController.__testables;
  const listing = {
    location: {
      province: "Harare",
      city: "Avondale",
      addressLine: "12 King George Road",
    },
    monthlyRent: 650,
    bedrooms: 2,
    totalRooms: 4,
    amenities: {},
  };

  assert.equal(
    matchesSavedSearch({ criteria: { location: "Avondale" } }, listing),
    true
  );
  assert.equal(
    matchesSavedSearch({ criteria: { location: "King George" } }, listing),
    true
  );
  assert.equal(
    matchesSavedSearch({ criteria: { location: "Harare" } }, listing),
    true
  );
});

test("matchesSavedSearch preserves legacy string location matching", () => {
  const { matchesSavedSearch } = listingController.__testables;
  const listing = {
    location: "Borrowdale, Harare",
    monthlyRent: 650,
    bedrooms: 2,
    totalRooms: 4,
    amenities: {},
  };

  assert.equal(
    matchesSavedSearch({ criteria: { location: "Borrowdale" } }, listing),
    true
  );
});

test("getListings uses a legacy-compatible location filter for province queries", async () => {
  let capturedFilter = null;
  Listing.updateMany = async () => ({ modifiedCount: 0 });

  Listing.find = (filter) => {
    capturedFilter = filter;
    return {
      skip() {
        return this;
      },
      limit() {
        return this;
      },
      async sort() {
        return [];
      },
    };
  };

  const result = await invokeController(listingController.getListings, {
    query: { province: "Harare" },
  });

  assert.deepEqual(capturedFilter.$and[0].$or, [
    { "location.province": /Harare/i },
    { location: /Harare/i },
  ]);
  assert.equal(result.statusCode, 200);
});

test("getHomeGroupedByLocation normalizes legacy string locations before grouping", async () => {
  let capturedPipeline = null;
  Listing.updateMany = async () => ({ modifiedCount: 0 });

  Listing.aggregate = async (pipeline) => {
    capturedPipeline = pipeline;
    return [];
  };

  const result = await invokeController(listingController.getHomeGroupedByLocation, {
    query: {},
  });

  assert.deepEqual(capturedPipeline[0], {
    $addFields: {
      _normalizedProvince: {
        $ifNull: ["$location.province", "$location"],
      },
    },
  });
  assert.deepEqual(capturedPipeline[1], {
    $match: {
      status: "active",
      _normalizedProvince: { $exists: true, $ne: "" },
    },
  });
  assert.equal(capturedPipeline[3].$group._id, "$_normalizedProvince");
  assert.equal(
    capturedPipeline[3].$group.listings.$push.location,
    "$_normalizedProvince"
  );
  assert.equal(result.statusCode, 200);
});

test("backfillLegacyLocations converts string locations to canonical objects", async () => {
  const originalUpdateMany = Listing.collection.updateMany;
  let capturedFilter = null;
  let capturedUpdate = null;

  Listing.collection.updateMany = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return { modifiedCount: 2 };
  };

  try {
    const result = await Listing.backfillLegacyLocations();
    assert.equal(result.modifiedCount, 2);
    assert.deepEqual(capturedFilter, { location: { $type: "string" } });
    assert.ok(Array.isArray(capturedUpdate));
    assert.equal(capturedUpdate[0].$set.location.country, "Zimbabwe");
    assert.deepEqual(capturedUpdate[0].$set.location.coordinates, {
      lat: null,
      lng: null,
    });
  } finally {
    Listing.collection.updateMany = originalUpdateMany;
  }
});
