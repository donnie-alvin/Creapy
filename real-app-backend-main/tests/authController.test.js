const test = require("node:test");
const assert = require("node:assert/strict");

const emailUtils = require("../utils/email");
const Listing = require("../models/listingModel");
const User = require("../models/userModel");

const originalSendEmail = emailUtils.sendEmail;

const loadAuthController = () => {
  delete require.cache[require.resolve("../controllers/authController")];
  return require("../controllers/authController");
};

const originalListingFindById = Listing.findById;
const originalUserFindById = User.findById;
const originalUserFindOne = User.findOne;
const originalUserDeleteOne = User.deleteOne;
const originalUserSave = User.prototype.save;

const invokeController = (handler, req = {}) =>
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
        resolve({ error: err, statusCode: res.statusCode, body: res.body });
        return;
      }

      resolve({ statusCode: res.statusCode, body: res.body });
    });
  });

test.before(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
});

test.afterEach(() => {
  emailUtils.sendEmail = originalSendEmail;
  Listing.findById = originalListingFindById;
  User.findById = originalUserFindById;
  User.findOne = originalUserFindOne;
  User.deleteOne = originalUserDeleteOne;
  User.prototype.save = originalUserSave;
});

test("getUser returns a public-safe payload for anonymous viewers", async () => {
  const authController = loadAuthController();
  Listing.findById = async () => ({ user: "owner-1" });
  User.findById = async () => ({
    _id: "owner-1",
    username: "landlord",
    avatar: "avatar.png",
    role: "landlord",
    email: "owner@example.com",
    phoneNumber: "+263771234567",
    nationalId: "63-123456-A-12",
    emailVerificationToken: "secret",
    emailVerificationExpires: new Date(),
    toObject() {
      return { ...this };
    },
  });

  const result = await invokeController(authController.getUser, {
    params: { id: "listing-1" },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body.data, {
    _id: "owner-1",
    username: "landlord",
    avatar: "avatar.png",
    role: "landlord",
  });
  assert.equal("email" in result.body.data, false);
  assert.equal("nationalId" in result.body.data, false);
  assert.equal("emailVerificationToken" in result.body.data, false);
});

test("getUser includes contact details only when auth context is present", async () => {
  const authController = loadAuthController();
  Listing.findById = async () => ({ user: "owner-1" });
  User.findById = async () => ({
    _id: "owner-1",
    username: "landlord",
    avatar: "avatar.png",
    role: "landlord",
    email: "owner@example.com",
    phoneNumber: "+263771234567",
    nationalId: "63-123456-A-12",
    toObject() {
      return { ...this };
    },
  });

  const result = await invokeController(authController.getUser, {
    params: { id: "listing-1" },
    user: { _id: "viewer-1" },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.email, "owner@example.com");
  assert.equal(result.body.data.phoneNumber, "+263771234567");
  assert.equal("nationalId" in result.body.data, false);
});

test("signup removes a newly created user if verification email delivery fails", async () => {
  let deletedFilter = null;

  emailUtils.sendEmail = async () => {
    throw new Error("smtp down");
  };

  const authController = loadAuthController();

  User.prototype.save = async function () {
    this._id = "new-user-id";
    return this;
  };

  User.deleteOne = async (filter) => {
    deletedFilter = filter;
    return { deletedCount: 1 };
  };

  const result = await invokeController(authController.signup, {
    body: {
      username: "new-landlord",
      email: "new@example.com",
      password: "password123",
      role: "landlord",
      phoneNumber: "+263771234567",
      nationalId: "63-123456-A-12",
    },
  });

  assert(result.error);
  assert.equal(result.error.statusCode, 503);
  assert.equal(
    result.error.message,
    "We couldn't send the verification email. Please try signing up again."
  );
  assert.ok(deletedFilter && deletedFilter._id);
});

test("login backfills legacy users without verification metadata and allows access", async () => {
  const authController = loadAuthController();
  let saveCalled = false;
  const user = {
    _id: "legacy-1",
    email: "legacy@example.com",
    password: "hashed-password",
    isEmailVerified: undefined,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    correctPassword: async () => true,
    backfillEmailVerificationStatus: User.prototype.backfillEmailVerificationStatus,
    async save() {
      saveCalled = true;
      return this;
    },
  };

  User.findOne = async () => user;

  const result = await invokeController(authController.login, {
    body: {
      email: "legacy@example.com",
      password: "password123",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(saveCalled, true);
  assert.equal(user.isEmailVerified, true);
  assert.ok(result.body.token);
});

test("login blocks legacy users whose verification state backfills to unverified", async () => {
  const authController = loadAuthController();
  let saveCalled = false;
  const user = {
    _id: "legacy-2",
    email: "pending@example.com",
    password: "hashed-password",
    isEmailVerified: undefined,
    emailVerificationToken: "pending-token",
    emailVerificationExpires: new Date(Date.now() + 60_000),
    correctPassword: async () => true,
    backfillEmailVerificationStatus: User.prototype.backfillEmailVerificationStatus,
    async save() {
      saveCalled = true;
      return this;
    },
  };

  User.findOne = async () => user;

  const result = await invokeController(authController.login, {
    body: {
      email: "pending@example.com",
      password: "password123",
    },
  });

  assert(result.error);
  assert.equal(saveCalled, true);
  assert.equal(user.isEmailVerified, false);
  assert.equal(result.error.statusCode, 403);
  assert.equal(result.error.message, "Please verify your email before logging in");
});
