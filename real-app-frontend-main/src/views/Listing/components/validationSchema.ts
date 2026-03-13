import * as Yup from "yup";

const optionalNumber = Yup.number()
  .transform((value, originalValue) => {
    if (originalValue === "" || originalValue == null) {
      return null;
    }
    return Number.isNaN(value) ? null : value;
  })
  .nullable();

export const listingSchema = Yup.object().shape({
  name: Yup.string().required("Name is required").nullable(),
  description: Yup.string().required("Description is required").nullable(),
  address: Yup.string().required("Address is required").nullable(),
  location: Yup.object()
    .shape({
      province: Yup.string().required("Province is required"),
      city: Yup.string().optional(),
    })
    .required(),
  phoneNumber: Yup.string()
    .required("Contact number is required")
    .min(12, "Contact number is required")
    .nullable(),
  regularPrice: Yup.number()
    .required("Regular price is required")
    .nullable()
    .positive("Regular price must be greater than 0"),
  discountedPrice: Yup.mixed()
    .nullable()
    .when("regularPrice", (regularPrice, schema) => {
      return schema.test({
        test: (discountedPrice) => {
          return discountedPrice == null || discountedPrice <= regularPrice;
        },
        message: "Less than or equal to Regular Price",
      });
    }),
  bathrooms: optionalNumber
    .required("Bathrooms is required")
    .positive("Bathrooms must be greater than 0"),
  bedrooms: optionalNumber
    .optional()
    .positive("Bedrooms must be greater than 0"),
  totalRooms: optionalNumber
    .required("Total rooms is required")
    .positive("Total rooms must be greater than 0"),
  furnished: Yup.boolean().required("Furnished is required").nullable(),
  type: Yup.string().required("Type is required").nullable(),
  offer: Yup.boolean().required("Offer is required").nullable(),
  files: Yup.array()
    // .min(2, "At least 2 image is required")
    .max(6, "Maximum 6 images allowed"),
});
