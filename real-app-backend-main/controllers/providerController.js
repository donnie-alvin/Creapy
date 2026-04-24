const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { sendEmail } = require("../utils/email");

const SELF_RESTRICTED_FIELDS = new Set(["verificationStatus", "commissionRate"]);

const PROVIDER_PROFILE_FIELDS = [
  "businessName",
  "businessType",
  "registrationNumber",
  "contactPhone",
  "address",
  "checkInTime",
  "checkOutTime",
  "imageUrls",
  "description",
  "location",
  "amenities",
  "cancellationPolicy",
  "cancellationPolicyCustomText",
];

const ACCOUNT_FIELDS = [
  "username",
  "email",
  "password",
  "avatar",
  "phoneNumber",
  "nationalId",
];

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

const assertNoRestrictedSelfUpdates = (profile = {}) => {
  const restrictedFields = Object.keys(profile).filter((field) =>
    SELF_RESTRICTED_FIELDS.has(field)
  );

  if (restrictedFields.length) {
    throw new AppError(
      `Providers cannot update ${restrictedFields.join(", ")} themselves`,
      400
    );
  }
};

const pickAllowedProfileUpdates = (profile = {}) => {
  const updates = {};

  for (const field of PROVIDER_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(profile, field)) {
      updates[field] = profile[field];
    }
  }

  return updates;
};

const pickAccountUpdates = (body = {}) => {
  const updates = {};

  for (const field of ACCOUNT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
  }

  return updates;
};

const buildProviderResponse = (user) => ({
  _id: user.id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  phoneNumber: user.phoneNumber || null,
  nationalId: user.nationalId || null,
  role: user.role,
  providerProfile: user.providerProfile,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProviderOrFail = async (providerId) => {
  const provider = await prisma.user.findFirst({
    where: { id: providerId, role: "provider" },
  });

  if (!provider) {
    throw new AppError("Provider not found", 404);
  }

  return provider;
};

exports.registerProvider = catchAsync(async (req, res, next) => {
  const rawProfile = req.body.providerProfile || req.body;
  assertNoRestrictedSelfUpdates(rawProfile);

  const verification = createEmailVerificationToken();
  const accountUpdates = pickAccountUpdates(req.body);
  const profileUpdates = pickAllowedProfileUpdates(rawProfile);
  const hashedPassword = await bcrypt.hash(accountUpdates.password, 12);
  const user = await prisma.user.create({
    data: {
      ...accountUpdates,
      password: hashedPassword,
      role: "provider",
      isEmailVerified: false,
      emailVerificationToken: verification.hashedToken,
      emailVerificationExpires: new Date(verification.expiresAt),
      providerProfile: {
        ...profileUpdates,
        verificationStatus: "pending",
        commissionRate: 10,
      },
    },
  });

  if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });
    verifiedUser.password = undefined;

    return res.status(201).json({
      status: "pending_verification",
      data: {
        user: buildProviderResponse(verifiedUser),
      },
    });
  }

  try {
    await sendVerificationEmail(user, verification.rawToken);
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } });

    return next(
      new AppError(
        "We couldn't send the verification email. Please try signing up again.",
        503
      )
    );
  }

  user.password = undefined;

  res.status(201).json({
    status: "pending_verification",
    data: {
      user: buildProviderResponse(user),
    },
  });
});

exports.getMyProfile = catchAsync(async (req, res) => {
  const provider = await getProviderOrFail(req.user.id);
  provider.password = undefined;

  res.status(200).json({
    status: "success",
    data: {
      provider: buildProviderResponse(provider),
    },
  });
});

exports.updateMyProfile = catchAsync(async (req, res) => {
  const provider = await getProviderOrFail(req.user.id);
  const rawProfile = req.body.providerProfile || req.body;
  assertNoRestrictedSelfUpdates(rawProfile);

  const accountUpdates = pickAccountUpdates(req.body);
  const profileUpdates = pickAllowedProfileUpdates(rawProfile);
  const mergedProfile = {
    ...(provider.providerProfile || {}),
    ...profileUpdates,
  };
  if (accountUpdates.password) {
    accountUpdates.password = await bcrypt.hash(accountUpdates.password, 12);
  }

  const updatedProvider = await prisma.user.update({
    where: { id: provider.id },
    data: {
      ...accountUpdates,
      providerProfile: mergedProfile,
    },
  });
  updatedProvider.password = undefined;

  res.status(200).json({
    status: "success",
    data: {
      provider: buildProviderResponse(updatedProvider),
    },
  });
});

exports.listProviders = catchAsync(async (req, res) => {
  let providers = await prisma.user.findMany({
    where: { role: "provider" },
    orderBy: { createdAt: "desc" },
  });

  if (req.query.verificationStatus) {
    providers = providers.filter(
      (provider) =>
        provider.providerProfile?.verificationStatus ===
        req.query.verificationStatus
    );
  }

  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), "i");
    providers = providers.filter((provider) =>
      [
        provider.username,
        provider.email,
        provider.phoneNumber,
        provider.providerProfile?.businessName,
        provider.providerProfile?.location?.city,
        provider.providerProfile?.location?.province,
      ].some((value) => searchRegex.test(String(value || "")))
    );
  }

  const roomCounts = await prisma.room.groupBy({
    by: ["providerId"],
    _count: { id: true },
  });
  const roomCountMap = new Map(
    roomCounts.map((entry) => [entry.providerId, entry._count.id])
  );

  res.status(200).json({
    status: "success",
    total: providers.length,
    data: providers.map((provider) => ({
      ...buildProviderResponse(provider),
      roomCount: roomCountMap.get(provider.id) || 0,
    })),
  });
});

exports.verifyProvider = catchAsync(async (req, res, next) => {
  const provider = await getProviderOrFail(req.params.id);
  const verificationStatus = req.body.verificationStatus || req.body.status;

  if (!["approved", "rejected"].includes(verificationStatus)) {
    return next(new AppError("Invalid verification status", 400));
  }

  const updatedProvider = await prisma.user.update({
    where: { id: provider.id },
    data: {
      providerProfile: {
        ...(provider.providerProfile || {}),
        verificationStatus,
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      provider: buildProviderResponse(updatedProvider),
    },
  });
});

exports.updateProviderCommission = catchAsync(async (req, res, next) => {
  const provider = await getProviderOrFail(req.params.id);

  const commissionRate = Number(req.body.commissionRate);
  if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return next(new AppError("commissionRate must be between 0 and 100", 400));
  }

  const updatedProvider = await prisma.user.update({
    where: { id: provider.id },
    data: {
      providerProfile: {
        ...(provider.providerProfile || {}),
        commissionRate,
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: buildProviderResponse(updatedProvider),
  });
});

exports.getAllProviders = exports.listProviders;
exports.updateCommission = exports.updateProviderCommission;
exports.getMyProviderProfile = exports.getMyProfile;
exports.updateMyProviderProfile = exports.updateMyProfile;
