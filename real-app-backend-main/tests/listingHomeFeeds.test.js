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

test("getHomeHighlighted returns active listings with default limit", async () => {
  const sample = [{ _id: "1" }, { _id: "2" }];
  let capturedFilter = null;
  let capturedSort = null;
  let capturedLimit = null;

  // stub updateMany to avoid DB requirement
  Listing.updateMany = async () => ({ modifiedCount: 0 });

  Listing.find = (filter) => {
    capturedFilter = filter;
    return {
      sort(sortObj) {
        capturedSort = sortObj;
        return {
          async limit(limit) {
            capturedLimit = limit;
            return sample;
          },
        };
      },
    };
  };

  const result = await invokeController(listingController.getHomeHighlighted, {
    query: {},
  });

  assert.deepEqual(capturedFilter, { status: "active" });
  assert.deepEqual(capturedSort, { createdAt: -1 });
  assert.equal(capturedLimit, 9);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.results, 2);
  assert.deepEqual(result.body.data, sample);
});

test("getHomeHighlighted respects custom limit", async () => {
  let capturedLimit = null;
  Listing.updateMany = async () => ({ modifiedCount: 0 });

  Listing.find = () => ({
    sort: () => ({
      async limit(limit) {
        capturedLimit = limit;
        return [];
      },
    }),
  });

  await invokeController(listingController.getHomeHighlighted, {
    query: { limit: "4" },
  });

  assert.equal(capturedLimit, 4);
});

test("getHomeGroupedByLocation builds grouped response with limits", async () => {
  const groupedResult = [
    {
      location: "Harare",
      listings: [{ _id: "a1", image: null }],
    },
  ];
  let pipeline = null;
  Listing.updateMany = async () => ({ modifiedCount: 0 });

  Listing.aggregate = async (stages) => {
    pipeline = stages;
    return groupedResult;
  };

  const result = await invokeController(
    listingController.getHomeGroupedByLocation,
    {
      query: { locationsLimit: "3", perLocation: "5" },
    }
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.equal(result.body.results, 1);
  assert.deepEqual(result.body.data, groupedResult);

  assert.ok(Array.isArray(pipeline));
  assert.ok(
    pipeline.some(
      (stage) =>
        stage.$addFields &&
        stage.$addFields._normalizedProvince
    )
  );
  assert.ok(
    pipeline.some(
      (stage) =>
        stage.$match &&
        stage.$match.status === "active" &&
        stage.$match._normalizedProvince
    )
  );
  assert.ok(
    pipeline.some(
      (stage) =>
        stage.$project &&
        stage.$project.listings &&
        Array.isArray(stage.$project.listings.$slice) &&
        stage.$project.listings.$slice[1] === 5
    )
  );
  assert.ok(
    pipeline.some((stage) => stage.$limit === 3)
  );
});

test("getListings applies compatible province filter for canonical and legacy locations", async () => {
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

  await invokeController(listingController.getListings, {
    query: { province: "Harare" },
  });

  assert.ok(Array.isArray(capturedFilter.$and));
  assert.equal(capturedFilter.$and.length, 1);
  assert.equal(capturedFilter.$and[0].$or.length, 2);
  assert.match("Harare", capturedFilter.$and[0].$or[0]["location.province"]);
  assert.match("Harare", capturedFilter.$and[0].$or[1].location);
});
