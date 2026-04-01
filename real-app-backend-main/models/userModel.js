// 3rd party imports
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const providerLocationSchema = new mongoose.Schema(
  {
    addressLine: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "Zimbabwe",
    },
    province: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    coordinates: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
  },
  { _id: false }
);

const providerAmenitiesSchema = new mongoose.Schema(
  {
    wifi: { type: Boolean, default: false },
    pool: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    breakfast: { type: Boolean, default: false },
    aircon: { type: Boolean, default: false },
    conferenceRoom: { type: Boolean, default: false },
    airportPickup: { type: Boolean, default: false },
    familyFriendly: { type: Boolean, default: false },
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      trim: true,
      default: "",
    },
    businessType: {
      type: String,
      enum: [
        "hotel",
        "lodge",
        "bnb",
        "motel",
        "inn",
        "guesthouse",
        "serviced_apartment",
        "backpackers",
        "other",
      ],
    },
    registrationNumber: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    address: {
      type: String,
    },
    checkInTime: {
      type: String,
    },
    checkOutTime: {
      type: String,
    },
    imageUrls: [{ type: String }],
    description: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    location: {
      type: providerLocationSchema,
      default: () => ({}),
    },
    amenities: {
      type: providerAmenitiesSchema,
      default: () => ({}),
    },
    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict", "non_refundable", "custom"],
      default: "flexible",
    },
    cancellationPolicyCustomText: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Please tell us your name!"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      // select: false,
    },
    avatar: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5jifLXKb2qo_5aXh54USNlvxI34oPpG3zTw&usqp=CAU",
    },
    role: {
      type: String,
      enum: ["tenant", "landlord", "provider", "admin"],
      default: "tenant",
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    nationalId: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    premiumExpiry: {
      type: Date,
      default: null,
    },
    providerProfile: {
      type: providerProfileSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password Hashing
userSchema.pre("save", async function (next) {
  // Only hash the password if it is new or has been modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.backfillEmailVerificationStatus = async function () {
  if (typeof this.isEmailVerified === "boolean") {
    return this.isEmailVerified;
  }

  // Legacy users created before email verification existed had no token state.
  this.isEmailVerified = !this.emailVerificationToken && !this.emailVerificationExpires;
  await this.save({ validateBeforeSave: false });

  return this.isEmailVerified;
};

const User = new mongoose.model("User", userSchema);
module.exports = User;
