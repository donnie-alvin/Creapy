const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const emailUtils = require("../utils/email");
const prisma = require("../utils/prisma");

const originalSendEmail = emailUtils.sendEmail;
const originalPrisma = {
  listingFindUnique: prisma.listing.findUnique,
  userCreate: prisma.user.create,
  userDelete: prisma.user.delete,
  userFindFirst: prisma.user.findFirst,
  userFindUnique: prisma.user.findUnique,
  userUpdate: prisma.user.update,
};

const loadAuthController = () => {
  delete require.cache[require.resolve("../controllers/authController")];
  return require("../controllers/authController");
};

const invokeController = (handler, req = {}) =>
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
  prisma.listing.findUnique = originalPrisma.listingFindUnique;
  prisma.user.create = originalPrisma.userCreate;
  prisma.user.delete = originalPrisma.userDelete;
  prisma.user.findFirst = originalPrisma.userFindFirst;
  prisma.user.findUnique = originalPrisma.userFindUnique;
  prisma.user.update = originalPrisma.userUpdate;
  delete process.env.SKIP_EMAIL_VERIFICATION;
});

test("getUser returns a public-safe payload for anonymous viewers", async () => {
  const authController = loadAuthController();
  prisma.listing.findUnique = async () => ({ id: "listing-1", userId: "owner-1" });
  prisma.user.findUnique = async () => ({
    id: "owner-1",
    username: "landlord",
    avatar: "avatar.png",
    role: "landlord",
    email: "owner@example.com",
    phoneNumber: "+263771234567",
    nationalId: "63-123456-A-12",
    emailVerificationToken: "secret",
    emailVerificationExpires: new Date(),
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
  prisma.listing.findUnique = async () => ({ id: "listing-1", userId: "owner-1" });
  prisma.user.findUnique = async () => ({
    id: "owner-1",
    username: "landlord",
    avatar: "avatar.png",
    role: "landlord",
    email: "owner@example.com",
    phoneNumber: "+263771234567",
    nationalId: "63-123456-A-12",
  });

  const result = await invokeController(authController.getUser, {
    params: { id: "listing-1" },
    user: { id: "viewer-1" },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.email, "owner@example.com");
  assert.equal(result.body.data.phoneNumber, "+263771234567");
  assert.equal("nationalId" in result.body.data, false);
});

test("signup removes a newly created user if verification email delivery fails", async () => {
  let deletedFilter = null;

  emailUtils.sendEmail = async () => {
    throw new Error("ses down");
  };

  const authController = loadAuthController();

  prisma.user.create = async ({ data }) => ({
    id: "new-user-id",
    ...data,
  });

  prisma.user.delete = async ({ where }) => {
    deletedFilter = where;
    return { id: where.id };
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
  assert.deepEqual(deletedFilter, { id: "new-user-id" });
});

test("login allows verified legacy-compatible users to access the API", async () => {
  const authController = loadAuthController();
  prisma.user.findUnique = async () => ({
    id: "legacy-1",
    email: "legacy@example.com",
    password:
      "$2a$12$eSWb0YLeBJ2rwbW5rsHJL.ue4SqeYpybOXnMwoDdYPSop4WPNStoO",
    isEmailVerified: true,
  });

  const result = await invokeController(authController.login, {
    body: {
      email: "legacy@example.com",
      password: "password123",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.ok(result.body.token);
  assert.equal(result.body.data.user._id, "legacy-1");
});

test("login blocks users whose verification state is unverified", async () => {
  const authController = loadAuthController();
  prisma.user.findUnique = async () => ({
    id: "legacy-2",
    email: "pending@example.com",
    password:
      "$2a$12$eSWb0YLeBJ2rwbW5rsHJL.ue4SqeYpybOXnMwoDdYPSop4WPNStoO",
    isEmailVerified: false,
  });

  const result = await invokeController(authController.login, {
    body: {
      email: "pending@example.com",
      password: "password123",
    },
  });

  assert(result.error);
  assert.equal(result.error.statusCode, 403);
  assert.equal(result.error.message, "Please verify your email before logging in");
});

test("verifyEmail returns a login-shaped success response for valid tokens", async () => {
  const authController = loadAuthController();
  let queriedFilter = null;
  let updateArgs = null;

  prisma.user.findFirst = async (query) => {
    queriedFilter = query.where;
    return {
      id: "verified-user-1",
      username: "verified-user",
      email: "verified@example.com",
      role: "tenant",
      password: "hashed-password",
      isEmailVerified: false,
    };
  };

  prisma.user.update = async (args) => {
    updateArgs = args;
    return {
      id: "verified-user-1",
      username: "verified-user",
      email: "verified@example.com",
      role: "tenant",
      password: "hashed-password",
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    };
  };

  const result = await invokeController(authController.verifyEmail, {
    query: { token: "raw-verification-token" },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "success");
  assert.ok(result.body.token);
  assert.ok(result.body.data.user);
  assert.equal(result.body.data.user._id, "verified-user-1");
  assert.equal(updateArgs.where.id, "verified-user-1");
  assert.equal(updateArgs.data.isEmailVerified, true);
  assert.equal(updateArgs.data.emailVerificationToken, null);
  assert.equal(updateArgs.data.emailVerificationExpires, null);
  assert.ok(queriedFilter);
  assert.ok(queriedFilter.emailVerificationToken);
  assert.ok(queriedFilter.emailVerificationExpires.gt instanceof Date);
  assert.equal(jwt.verify(result.body.token, process.env.JWT_SECRET).id, "verified-user-1");
});

test("verifyEmail preserves invalid or expired token errors", async () => {
  const authController = loadAuthController();

  prisma.user.findFirst = async () => null;

  const result = await invokeController(authController.verifyEmail, {
    query: { token: "expired-or-invalid-token" },
  });

  assert(result.error);
  assert.equal(result.error.statusCode, 400);
  assert.equal(result.error.message, "Verification link is invalid or has expired");
});

test("google marks existing unverified users as verified before issuing a token", async () => {
  const authController = loadAuthController();
  let updateArgs = null;

  prisma.user.findUnique = async () => ({
    id: "google-user-1",
    email: "google@example.com",
    username: "existing-user",
    role: "tenant",
    password: "hashed-password",
    isEmailVerified: false,
  });

  prisma.user.update = async (args) => {
    updateArgs = args;
    return {
      id: "google-user-1",
      email: "google@example.com",
      username: "existing-user",
      role: "tenant",
      password: "hashed-password",
      isEmailVerified: true,
    };
  };

  const result = await invokeController(authController.google, {
    body: {
      name: "Existing User",
      email: "google@example.com",
      photo: "avatar.png",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(updateArgs, {
    where: { id: "google-user-1" },
    data: { isEmailVerified: true },
  });
  assert.ok(result.body.token);
  assert.equal(result.body.data.user._id, "google-user-1");
});

test("google does not re-save existing users that are already verified", async () => {
  const authController = loadAuthController();
  let updateCalled = false;

  prisma.user.findUnique = async () => ({
    id: "google-user-2",
    email: "verified-google@example.com",
    username: "verified-user",
    role: "tenant",
    password: "hashed-password",
    isEmailVerified: true,
  });

  prisma.user.update = async () => {
    updateCalled = true;
    throw new Error("should not update verified user");
  };

  const result = await invokeController(authController.google, {
    body: {
      name: "Verified User",
      email: "verified-google@example.com",
      photo: "avatar.png",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(updateCalled, false);
  assert.ok(result.body.token);
  assert.equal(result.body.data.user._id, "google-user-2");
});
