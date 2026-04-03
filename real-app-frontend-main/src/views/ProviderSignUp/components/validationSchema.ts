import * as Yup from "yup";

const passwordMessage =
  "Password should contain minimum 8 characters, with a mix of uppercase letter, number, and symbol.";

export const providerSignUpSchema = Yup.object().shape({
  userName: Yup.string().required("Username is required").nullable(),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required")
    .nullable(),
  password: Yup.string()
    .required(passwordMessage)
    .min(8, passwordMessage)
    .matches(/[@$!%*?&]/, passwordMessage)
    .matches(/\d/, passwordMessage)
    .matches(/[A-Z]/, passwordMessage),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  businessName: Yup.string().required("Business name is required").nullable(),
  businessType: Yup.string()
    .oneOf(
      ["hotel", "lodge", "bnb", "guesthouse", "motel", "backpackers"],
      "Select a valid business type"
    )
    .required("Business type is required"),
  contactPhone: Yup.string().required("Contact phone is required").nullable(),
  address: Yup.string().required("Address is required").nullable(),
  province: Yup.string().required("Province is required").nullable(),
  city: Yup.string().required("City is required").nullable(),
  registrationNumber: Yup.string().nullable(),
  description: Yup.string().nullable(),
  checkInTime: Yup.string().nullable(),
  checkOutTime: Yup.string().nullable(),
});
