const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
// Custom Imports
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const prisma = require("../utils/prisma");
const { comparePassword } = require("../utils/auth");
const { isPremiumTenant } = require("../utils/monetization");
const { sendEmail } = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    hashedToken: hashVerificationToken(rawToken),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
};

const getAppBaseUrl = () => {
  const configuredBaseUrl =
    process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:3000";

  return configuredBaseUrl.replace(/\/+$/, "");
};

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your Creapy email",
    text: `Welcome to Creapy. Verify your email by opening this link: ${verificationUrl}`,
    html: `
      <p>Welcome to Creapy.</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const buildPublicUserPayload = (user, { includeContactDetails = false } = {}) => {
  const source = user;
  const payload = {
    _id: source.id,
    username: source.username,
    avatar: source.avatar,
    role: source.role,
  };

  if (includeContactDetails) {
    payload.email = source.email;
    payload.phoneNumber = source.phoneNumber || null;
  }

  return payload;
};

const buildAuthUserPayload = (user) => ({
  ...user,
  _id: user.id,
});

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const { password, ...sanitizedUser } = user;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: buildAuthUserPayload(sanitizedUser),
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { username, email, password, role, phoneNumber, nationalId } = req.body;
  const allowedRoles = ["tenant", "landlord"];

  if (role && !allowedRoles.includes(role)) {
    return next(new AppError("Invalid role. Role must be tenant or landlord", 400));
  }

  if (role === "landlord" && (!phoneNumber || !nationalId)) {
    return next(
      new AppError("Phone number and national ID are required for landlords", 400)
    );
  }

  const verification = createEmailVerificationToken();
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: await bcrypt.hash(password, 12),
      ...(role ? { role } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(nationalId ? { nationalId } : {}),
      isEmailVerified: false,
      emailVerificationToken: verification.hashedToken,
      emailVerificationExpires: new Date(verification.expiresAt),
    },
  });

  if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
    const verifiedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: { isEmailVerified: true },
    });
    createSendToken(verifiedUser, 201, res);
    return;
  }

  try {
    await sendVerificationEmail(newUser, verification.rawToken);
  } catch (error) {
    await prisma.user.delete({ where: { id: newUser.id } });

    return next(
      new AppError(
        "We couldn't send the verification email. Please try signing up again.",
        503
      )
    );
  }

  newUser.password = undefined;

  res.status(201).json({
    status: "pending_verification",
    message: "Account created. Please check your email to verify your account.",
    data: {
      user: buildAuthUserPayload(newUser),
    },
  });
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // 2) Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(new AppError("User not found", 404));

  // 3) Check if password is correct
  const correct = await comparePassword(password, user.password);
  if (!correct) {
    return next(new AppError("Incorrect password", 401));
  }

  if (user.isEmailVerified !== true) {
    return next(new AppError("Please verify your email before logging in", 403));
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const rawToken = req.query.token;

  if (!rawToken) {
    return next(new AppError("Verification token is required", 400));
  }

  const hashedToken = hashVerificationToken(rawToken.toString());

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return next(new AppError("Verification link is invalid or has expired", 400));
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  createSendToken(verifiedUser, 200, res);
});

exports.getUser = catchAsync(async (req, res, next) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });
  if (!listing) {
    return next(new AppError("No listing found with that ID", 404));
  }

  const user = await prisma.user.findUnique({
    where: { id: listing.userId },
  });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: buildPublicUserPayload(user, {
      includeContactDetails: Boolean(req.user),
    }),
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { username, email, password, avatar } = req.body.payload;

  // 1) Check if user exists
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // 2) hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3) Update user
  const newUser = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      username,
      email,
      password: hashedPassword,
      avatar,
    },
  });

  // 4) If everything ok, send token to client
  createSendToken(newUser, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  delete user.password;

  res.status(200).json({
    status: "success",
    data: {
      user: {
        ...user,
        _id: user.id,
      },
    },
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  // 1) Find User
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }
  // 2) Delete User
  await prisma.user.delete({ where: { id: req.params.id } });

  // 3) If everything ok, send token to client
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.google = catchAsync(async (req, res, next) => {
  const { name, email, photo } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    let currentUser = user;
    if (user.isEmailVerified !== true) {
      currentUser = await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }
    // just return the user
    createSendToken(currentUser, 200, res);
  } else {
    const newUser = await prisma.user.create({
      data: {
        username: name,
        email,
        password: await bcrypt.hash(Math.random().toString(), 12),
        avatar: photo,
        isEmailVerified: true,
      },
    });

    createSendToken(newUser, 201, res);
  }
});

exports.optionalAuth = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token, just continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    // 2) Verification token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await prisma.user.findUnique({ where: { id: decode.id } });
    if (freshUser) {
      // GRANT ACCESS WITH USER CONTEXT
      req.user = freshUser;
    }
    // If user doesn't exist, silently continue without setting req.user
  } catch (err) {
    // Swallow auth errors and continue without req.user
  }
  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const freshUser = await prisma.user.findUnique({ where: { id: decode.id } });
  if (!freshUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new AppError("Access denied", 403));
    }
    next();
  };
};

exports.requirePremium = (req, res, next) => {
  if (!req.user || !isPremiumTenant(req.user)) {
    return next(
      new AppError("Premium feature. Please upgrade your account.", 402)
    );
  }
  next();
};
