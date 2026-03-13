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
        required: [true, "Please provide a province"],
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
      min: [1, "Bathrooms must be at least 1"],
    },
    bedrooms: {
      type: Number,
      min: [1, "Bedrooms must be at least 1"],
    },
    totalRooms: {
      type: Number,
      required: [true, "Please provide the total number of rooms"],
      min: [1, "Total rooms must be at least 1"],
    },
    furnished: {
      type: Boolean,
      required: [true, "Please provide the furnished status"],
    },
    type: {
      type: String,
      enum: ["rent"],
      default: "rent",
    },
    offer: {
      type: Boolean,
      required: [true, "Please provide the offer status"],
    },
    studentAccommodation: {
      type: Boolean,
      default: false,
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

listingSchema.statics.backfillLegacyLocations = async function () {
  return this.collection.updateMany(
    { location: { $type: "string" } },
    [
      {
        $set: {
          location: {
            addressLine: { $ifNull: ["$address", ""] },
            country: "Zimbabwe",
            province: {
              $trim: {
                input: { $ifNull: ["$location", ""] },
              },
            },
            city: "",
            coordinates: {
              lat: null,
              lng: null,
            },
          },
        },
      },
    ]
  );
};

const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;
