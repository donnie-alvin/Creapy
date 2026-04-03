import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid } from "@mui/material";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Form, Formik, FormikProps } from "formik";
import { onKeyDown } from "../../utils";
import { useRegisterProviderMutation } from "../../redux/api/providerApiSlice";
import DotLoader from "../../components/Spinner/dotLoader";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import { providerSignUpSchema } from "./components/validationSchema";
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import { BUSINESS_TYPES } from "../Stays";
import { ZIMBABWE_PROVINCES } from "../../config/zimbabweProvinces";

interface IProviderSignUpForm {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  businessType: string;
  registrationNumber: string;
  contactPhone: string;
  address: string;
  province: string;
  city: string;
  description: string;
  checkInTime: string;
  checkOutTime: string;
}

const initialValues: IProviderSignUpForm = {
  userName: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  businessType: "",
  registrationNumber: "",
  contactPhone: "",
  address: "",
  province: "",
  city: "",
  description: "",
  checkInTime: "",
  checkOutTime: "",
};

const ProviderSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const [registerProvider, { isLoading }] = useRegisterProviderMutation();

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, appearence: false }));
  };

  const handleSubmit = async (data: IProviderSignUpForm) => {
    const payload = {
      username: data.userName,
      email: data.email,
      password: data.password,
      businessName: data.businessName,
      businessType: data.businessType,
      registrationNumber: data.registrationNumber || undefined,
      contactPhone: data.contactPhone,
      address: data.address,
      province: data.province,
      city: data.city,
      description: data.description || undefined,
      checkInTime: data.checkInTime || undefined,
      checkOutTime: data.checkOutTime || undefined,
    };

    try {
      const user: any = await registerProvider(payload);

      if (user?.data?.status === "pending_verification" || user?.data) {
        setSubmitted(true);
        return;
      }

      if (user?.error) {
        setToast({
          message: user?.error?.data?.message || "Something went wrong",
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Provider Sign Up Error:", error);
      setToast({
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
          <Grid item xs={12} md={7}>
            <AppCard sx={{ p: { xs: 2.5, md: 3.5 } }}>
              {submitted ? (
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
                    Application Submitted
                  </Heading>
                  <SubHeading sx={{ color: "text.secondary", maxWidth: 440 }}>
                    Your provider account is pending verification. You will be able
                    to add rooms after admin approval.
                  </SubHeading>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      mt: 1,
                    }}
                  >
                    <AppButton onClick={() => navigate("/login")}>
                      Go to Login
                    </AppButton>
                    <AppButton
                      variant="outlined"
                      onClick={() => navigate("/stays")}
                    >
                      Browse Temporary Stays
                    </AppButton>
                  </Box>
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
                      List your stay
                    </Heading>
                    <SubHeading sx={{ color: "text.secondary", maxWidth: 520 }}>
                      Create a provider account to register your accommodation
                      business and start the verification process.
                    </SubHeading>
                  </Box>
                  <Box sx={{ width: "100%", marginTop: "10px" }}>
                    <Formik
                      initialValues={initialValues}
                      onSubmit={handleSubmit}
                      validationSchema={providerSignUpSchema}
                    >
                      {(props: FormikProps<IProviderSignUpForm>) => {
                        const {
                          values,
                          touched,
                          errors,
                          handleBlur,
                          handleChange,
                        } = props;

                        return (
                          <Form onKeyDown={onKeyDown}>
                            <Box sx={{ marginTop: "20px" }}>
                              <SubHeading sx={{ marginBottom: "12px" }}>
                                Account
                              </SubHeading>
                              <Box sx={{ display: "grid", gap: 1.5 }}>
                                <Box>
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
                                    error={Boolean(errors.userName && touched.userName)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                                <Box>
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
                                    error={Boolean(errors.email && touched.email)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                                <Box>
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
                                    error={Boolean(errors.password && touched.password)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={() =>
                                      setShowPassword((prev) => !prev)
                                    }
                                    endAdornment={
                                      showPassword ? (
                                        <AiOutlineEye color="disabled" />
                                      ) : (
                                        <AiOutlineEyeInvisible color="disabled" />
                                      )
                                    }
                                  />
                                </Box>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Confirm Password
                                  </SubHeading>
                                  <PrimaryInput
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    label=""
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={values.confirmPassword}
                                    helperText={
                                      errors.confirmPassword &&
                                      touched.confirmPassword
                                        ? errors.confirmPassword
                                        : ""
                                    }
                                    error={Boolean(
                                      errors.confirmPassword &&
                                        touched.confirmPassword
                                    )}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onClick={() =>
                                      setShowConfirmPassword((prev) => !prev)
                                    }
                                    endAdornment={
                                      showConfirmPassword ? (
                                        <AiOutlineEye color="disabled" />
                                      ) : (
                                        <AiOutlineEyeInvisible color="disabled" />
                                      )
                                    }
                                  />
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ marginTop: "20px" }}>
                              <SubHeading sx={{ marginBottom: "12px" }}>
                                Business
                              </SubHeading>
                              <Box sx={{ display: "grid", gap: 1.5 }}>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Business Name
                                  </SubHeading>
                                  <PrimaryInput
                                    type="text"
                                    label=""
                                    name="businessName"
                                    placeholder="Business Name"
                                    value={values.businessName}
                                    helperText={
                                      errors.businessName && touched.businessName
                                        ? errors.businessName
                                        : ""
                                    }
                                    error={Boolean(
                                      errors.businessName && touched.businessName
                                    )}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Business Type
                                  </SubHeading>
                                  <AppSelect
                                    name="businessType"
                                    value={values.businessType}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    displayEmpty
                                    options={BUSINESS_TYPES.filter(
                                      (option) => option.value !== ""
                                    )}
                                  />
                                  {errors.businessType && touched.businessType && (
                                    <Box
                                      sx={{
                                        fontSize: "12px",
                                        color: "#d32f2f",
                                        mt: "3px",
                                        ml: "2px",
                                      }}
                                    >
                                      {errors.businessType}
                                    </Box>
                                  )}
                                </Box>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Registration Number
                                  </SubHeading>
                                  <PrimaryInput
                                    type="text"
                                    label=""
                                    name="registrationNumber"
                                    placeholder="Registration Number (optional)"
                                    value={values.registrationNumber}
                                    helperText={
                                      errors.registrationNumber &&
                                      touched.registrationNumber
                                        ? errors.registrationNumber
                                        : ""
                                    }
                                    error={Boolean(
                                      errors.registrationNumber &&
                                        touched.registrationNumber
                                    )}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ marginTop: "20px" }}>
                              <SubHeading sx={{ marginBottom: "12px" }}>
                                Contact
                              </SubHeading>
                              <Box sx={{ display: "grid", gap: 1.5 }}>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Contact Phone
                                  </SubHeading>
                                  <PrimaryInput
                                    type="text"
                                    label=""
                                    name="contactPhone"
                                    placeholder="+263 77 123 4567"
                                    value={values.contactPhone}
                                    helperText={
                                      errors.contactPhone && touched.contactPhone
                                        ? errors.contactPhone
                                        : ""
                                    }
                                    error={Boolean(
                                      errors.contactPhone && touched.contactPhone
                                    )}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Address
                                  </SubHeading>
                                  <PrimaryInput
                                    type="text"
                                    label=""
                                    name="address"
                                    placeholder="Street address"
                                    value={values.address}
                                    helperText={
                                      errors.address && touched.address
                                        ? errors.address
                                        : ""
                                    }
                                    error={Boolean(errors.address && touched.address)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                  />
                                </Box>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6}>
                                    <SubHeading sx={{ marginBottom: "5px" }}>
                                      Province
                                    </SubHeading>
                                    <AppSelect
                                      name="province"
                                      value={values.province}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      displayEmpty
                                      options={ZIMBABWE_PROVINCES}
                                    />
                                    {errors.province && touched.province && (
                                      <Box
                                        sx={{
                                          fontSize: "12px",
                                          color: "#d32f2f",
                                          mt: "3px",
                                          ml: "2px",
                                        }}
                                      >
                                        {errors.province}
                                      </Box>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <SubHeading sx={{ marginBottom: "5px" }}>
                                      City
                                    </SubHeading>
                                    <PrimaryInput
                                      type="text"
                                      label=""
                                      name="city"
                                      placeholder="City"
                                      value={values.city}
                                      helperText={
                                        errors.city && touched.city ? errors.city : ""
                                      }
                                      error={Boolean(errors.city && touched.city)}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Box>

                            <Box sx={{ marginTop: "20px" }}>
                              <SubHeading sx={{ marginBottom: "12px" }}>
                                Optional details
                              </SubHeading>
                              <Box sx={{ display: "grid", gap: 1.5 }}>
                                <Box>
                                  <SubHeading sx={{ marginBottom: "5px" }}>
                                    Description
                                  </SubHeading>
                                  <PrimaryInput
                                    label=""
                                    name="description"
                                    placeholder="Tell us about your business"
                                    value={values.description}
                                    helperText={
                                      errors.description && touched.description
                                        ? errors.description
                                        : ""
                                    }
                                    error={Boolean(
                                      errors.description && touched.description
                                    )}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    multiline
                                    minRows={4}
                                    maxRows={6}
                                  />
                                </Box>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6}>
                                    <SubHeading sx={{ marginBottom: "5px" }}>
                                      Check-in Time
                                    </SubHeading>
                                    <PrimaryInput
                                      type="time"
                                      label=""
                                      name="checkInTime"
                                      value={values.checkInTime}
                                      helperText={
                                        errors.checkInTime && touched.checkInTime
                                          ? errors.checkInTime
                                          : ""
                                      }
                                      error={Boolean(
                                        errors.checkInTime && touched.checkInTime
                                      )}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <SubHeading sx={{ marginBottom: "5px" }}>
                                      Check-out Time
                                    </SubHeading>
                                    <PrimaryInput
                                      type="time"
                                      label=""
                                      name="checkOutTime"
                                      value={values.checkOutTime}
                                      helperText={
                                        errors.checkOutTime && touched.checkOutTime
                                          ? errors.checkOutTime
                                          : ""
                                      }
                                      error={Boolean(
                                        errors.checkOutTime && touched.checkOutTime
                                      )}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Box>

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
                                  "Submit Application"
                                )}
                              </AppButton>
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

export default ProviderSignUp;
