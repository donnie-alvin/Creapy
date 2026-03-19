import * as Yup from "yup";

const passwordMessage =
  "Password should contain minimum 8 characters, with a mix of uppercase letter, number, and symbol.";

export const signUpSchema = Yup.object().shape({
  userName: Yup.string().required("Username is required").nullable(),
  role: Yup.string()
    .oneOf(["tenant", "landlord"], "Role must be tenant or landlord")
    .required("Role is required"),
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
  phoneNumber: Yup.string().when("role", {
    is: "landlord",
    then: (schema) => schema.required("Phone number is required for landlords"),
    otherwise: (schema) => schema.nullable(),
  }),
  nationalId: Yup.string().when("role", {
    is: "landlord",
    then: (schema) => schema.required("National ID is required for landlords"),
    otherwise: (schema) => schema.nullable(),
  }),
});
