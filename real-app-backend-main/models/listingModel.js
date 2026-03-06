const mongoose = require("mongoose");
const validator = require("validator");

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    address: {
      type: String,
      required: [true, "Please provide an address"],
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: validator.isMobilePhone,
        message: "Please provide a valid phone number",
      },
      required: [true, "Please provide your phone number"],
    },
    monthlyRent: {
      type: Number,
      required: [true, "Please provide monthly rent"],
    },
    
    location: {
      type: String,
      required: [true, "Please provide location / area"],
    },
    amenities: {
      solar: { type: Boolean, default: false },
      borehole: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["pending_payment", "early_access", "active", "inactive"],
      default: "active",
    },
    earlyAccessUntil: { type: Date, default: null },
    publishedAt:      { type: Date, default: null },
    paymentDeadline:  { type: Date, default: null },
    
    bathrooms: {
      type: Number,
      required: [true, "Please provide the number of bathrooms"],
    },
    bedrooms: {
      type: Number,
      required: [true, "Please provide the number of bedrooms"],
    },
    furnished: {
      type: Boolean,
      required: [true, "Please provide the furnished status"],
    },
    type: {
      type: String,
      required: [true, "Please provide the type"],
    },
    offer: {
      type: Boolean,
      required: [true, "Please provide the offer status"],
    },
    imageUrls: {
      type: Array,
      required: [true, "Please provide the image urls"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Listing must belong to a user"],
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["active", "pending_payment", "early_access"] },
    },
  }
);

const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;
