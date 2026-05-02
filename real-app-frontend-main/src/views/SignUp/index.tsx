// React Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// MUI Imports
import { Box, Chip, FormControlLabel, Grid, Radio, RadioGroup } from "@mui/material";
// React Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
// Formik Imports
import { Form, Formik, FormikProps } from "formik";
// Utils Imports
import { onKeyDown } from "../../utils";
// Redux Imports
import { useSignupMutation } from "../../redux/api/authApiSlice";
// Components Imports
import DotLoader from "../../components/Spinner/dotLoader";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import { signUpSchema } from "./components/validationSchema";
import { Heading, SubHeading } from "../../components/Heading";
// Google OAuth Imports
import GoogleOAuth from "../../components/OAuth";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";

interface ISSignUpForm {
  userName: string;
  email: string;
  password: string;
  role: "tenant" | "landlord";
  phoneNumber: string;
  nationalId: string;
}

const SignUp = () => {
  const navigate = useNavigate();

  // states
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formValues, setFormValues] = useState<ISSignUpForm>({
    userName: "",
    email: "",
    password: "",
    role: "tenant",
    phoneNumber: "",
    nationalId: "",
  });

  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const hideShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  // Sign Up Api Bind
  const [signupUser, { isLoading }] = useSignupMutation();

  const SignUpHandler = async (data: ISSignUpForm) => {
    if (!["tenant", "landlord"].includes(data.role)) {
      setToast({
        ...toast,
        message: "Role must be tenant or landlord",
        appearence: true,
        type: "error",
      });
      return;
    }

    const payload = {
      username: data.userName,
      email: data.email,
      password: data.password,
      role: data.role,
      phoneNumber: data.role === "landlord" ? data.phoneNumber : undefined,
      nationalId: data.role === "landlord" ? data.nationalId : undefined,
    };
    try {
      const user: any = await signupUser(payload);

      if (user?.data?.status === "pending_verification") {
        setPendingVerificationEmail(data.email);
        return;
      }

      if (user?.data?.status === "pending_phone_verification") {
        navigate("/verify-phone", { state: { email: data.email } });
        return;
      }

      if (user?.data?.status) {
        setToast({
          ...toast,
          message: user?.data?.message || "Account created",
          appearence: true,
          type: "success",
        });
      }
      if (user?.error) {
        setToast({
          ...toast,
          message: user?.error?.data?.message,
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      console.error("SignUp Error:", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ margin: "70px 0" }}>
      <AppContainer>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} md={6} lg={5}>
            <AppCard sx={{ p: { xs: 2.5, md: 3.5 } }}>
              {pendingVerificationEmail ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    textAlign: "center",
                    py: 2,
                    gap: 1.5,
                  }}
                >
                  <Heading sx={{ fontSize: "32px", marginBottom: "6px" }}>
                    Check your email
                  </Heading>
                  <SubHeading sx={{ color: "text.secondary", maxWidth: 360 }}>
                    We sent a verification link to {pendingVerificationEmail}. Verify
                    your email before logging in.
                  </SubHeading>
                  <AppButton sx={{ mt: 1 }} onClick={() => navigate("/login")}>
                    Go to Login
                  </AppButton>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      textAlign: "center",
                    }}
                  >
                    <Heading sx={{ fontSize: "32px", marginBottom: "6px" }}>
                      Create your account
                    </Heading>
                    <SubHeading sx={{ color: "text.secondary" }}>
                      Join to save listings and manage your profile.
                    </SubHeading>
                  </Box>
                  <Box sx={{ width: "100%", marginTop: "10px" }}>
              <Formik
                initialValues={formValues}
                validate={(values: ISSignUpForm) => {
                  const validationErrors: Partial<
                    Record<keyof ISSignUpForm, string>
                  > = {};
                  if (!["tenant", "landlord"].includes(values.role)) {
                    validationErrors.role = "Role must be tenant or landlord";
                  }
                  return validationErrors;
                }}
                onSubmit={(values: ISSignUpForm) => {
                  SignUpHandler(values);
                }}
                validationSchema={signUpSchema}
              >
                {(props: FormikProps<ISSignUpForm>) => {
                  const { values, touched, errors, handleBlur, handleChange } =
                    props;

                  return (
                    <Form onKeyDown={onKeyDown}>
                      <Box sx={{ marginTop: "20px" }}>
                        <SubHeading sx={{ marginBottom: "5px" }}>
                          User Name
                        </SubHeading>
                        <PrimaryInput
                          type="text"
                          label=""
                          name="userName"
                          placeholder="User Name"
                          value={values.userName}
                          helperText={
                            errors.userName && touched.userName
                              ? errors.userName
                              : ""
                          }
                          error={
                            errors.userName && touched.userName ? true : false
                          }
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Box>
                      <Box sx={{ marginTop: "12px" }}>
                        <SubHeading sx={{ marginBottom: "5px" }}>
                          Email
                        </SubHeading>
                        <PrimaryInput
                          type="text"
                          label=""
                          name="email"
                          placeholder="Email"
                          value={values.email}
                          helperText={
                            errors.email && touched.email ? errors.email : ""
                          }
                          error={errors.email && touched.email ? true : false}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Box>
                      <Box sx={{ marginTop: "12px" }}>
                        <SubHeading sx={{ marginBottom: "5px" }}>
                          Password
                        </SubHeading>
                        <PrimaryInput
                          type={showPassword ? "text" : "password"}
                          label=""
                          name="password"
                          placeholder="Password"
                          value={values.password}
                          helperText={
                            errors.password && touched.password
                              ? errors.password
                              : ""
                          }
                          error={
                            errors.password && touched.password ? true : false
                          }
                          onChange={handleChange}
                          onBlur={handleBlur}
                          onClick={hideShowPassword}
                          endAdornment={
                            showPassword ? (
                              <AiOutlineEye color="disabled" />
                            ) : (
                              <AiOutlineEyeInvisible color="disabled" />
                            )
                          }
                        />
                      </Box>
                      <Box sx={{ marginTop: "12px" }}>
                        <SubHeading sx={{ marginBottom: "5px" }}>
                          I am a:
                        </SubHeading>
                        <RadioGroup
                          name="role"
                          value={values.role}
                          onChange={handleChange}
                          row
                        >
                          <FormControlLabel
                            value="tenant"
                            control={<Radio />}
                            label="Tenant"
                          />
                          <FormControlLabel
                            value="landlord"
                            control={<Radio />}
                            label="Landlord"
                          />
                        </RadioGroup>
                        {errors.role && touched.role && (
                          <Box sx={{ fontSize: "12px", color: "#d32f2f" }}>
                            {errors.role}
                          </Box>
                        )}
                      </Box>
                      {values.role === "landlord" && (
                        <Box
                          sx={{
                            marginTop: "12px",
                            padding: "16px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            background: "#f8fafc",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              flexWrap: "wrap",
                              marginBottom: "10px",
                            }}
                          >
                            <SubHeading>Landlord details</SubHeading>
                            <Chip label="Landlord only" size="small" sx={{ background: "#fef3c7", color: "#92400e" }} />
                          </Box>
                          <Box sx={{ marginTop: "12px" }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Phone Number
                            </SubHeading>
                            <PrimaryInput
                              type="text"
                              label=""
                              name="phoneNumber"
                              placeholder="+263 77 123 4567"
                              value={values.phoneNumber}
                              helperText={
                                errors.phoneNumber && touched.phoneNumber
                                  ? errors.phoneNumber
                                  : ""
                              }
                              error={
                                errors.phoneNumber && touched.phoneNumber ? true : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                          <Box sx={{ marginTop: "12px" }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              National ID Number
                            </SubHeading>
                            <PrimaryInput
                              type="text"
                              label=""
                              name="nationalId"
                              placeholder="e.g. 63-123456A78"
                              value={values.nationalId}
                              helperText={
                                errors.nationalId && touched.nationalId
                                  ? errors.nationalId
                                  : ""
                              }
                              error={
                                errors.nationalId && touched.nationalId ? true : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "end",
                          marginTop: "16px",
                        }}
                      >
                        <AppButton
                          type="submit"
                          fullWidth
                          disabled={isLoading}
                          sx={{ margin: "0 0 16px 0" }}
                        >
                          {isLoading ? (
                            <DotLoader color="#fff" size={12} />
                          ) : (
                            "Sign Up"
                          )}
                        </AppButton>
                      </Box>
                      <GoogleOAuth />
                      <Box
                        sx={{
                          margin: "0 0 10px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        Already have an account?
                        <Box
                          sx={{
                            color: "#1F4D3A",
                            fontWeight: 600,
                            cursor: "pointer",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                          onClick={() => {
                            navigate("/login");
                          }}
                        >
                          Login
                        </Box>
                      </Box>
                    </Form>
                  );
                }}
              </Formik>
                  </Box>
                </>
              )}
            </AppCard>
          </Grid>
        </Grid>
      </AppContainer>
      <ToastAlert
        appearence={toast.appearence}
        type={toast.type}
        message={toast.message}
        handleClose={handleCloseToast}
      />
    </Box>
  );
};

export default SignUp;
