// React Imports
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
// Material UI Imports
import { Box, Grid } from "@mui/material";
// React Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
// Formik Imports
import { Form, Formik, FormikProps } from "formik";
// Utils Imports
import { onKeyDown } from "../../utils";
// Redux Imports
import { useLoginMutation } from "../../redux/api/authApiSlice";
import { setUser } from "../../redux/auth/authSlice";
// Component Imports
import { Heading, SubHeading } from "../../components/Heading";
import DotLoader from "../../components/Spinner/dotLoader";
import { loginSchema } from "./components/validationSchema";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
// Google OAuth
import GoogleOAuth from "../../components/OAuth";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";

interface ISLoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // states
  const [showPassword, setShowPassword] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formValues, setFormValues] = useState<ISLoginForm>({
    email: "",
    password: "",
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
  const [loginUser, { isLoading }] = useLoginMutation();

  const LoginHandler = async (data: ISLoginForm) => {
    const payload = {
      email: data.email,
      password: data.password,
    };
    try {
      const user: any = await loginUser(payload);

      if (user?.data?.status) {
        dispatch(setUser(user?.data));
        localStorage.setItem("user", JSON.stringify(user?.data));
        const role = user?.data?.data?.user?.role;
        if (role === "landlord") {
          navigate("/dashboard/landlord");
        } else if (role === "tenant") {
          navigate("/dashboard/tenant");
        } else if (role === "admin") {
          navigate("/dashboard/admin");
        } else {
          navigate("/");
        }
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
                  Welcome back
                </Heading>
                <SubHeading sx={{ color: "text.secondary" }}>
                  Log in to continue searching and saving listings.
                </SubHeading>
              </Box>
              <Box sx={{ width: "100%", marginTop: "10px" }}>
              <Formik
                initialValues={formValues}
                onSubmit={(values: ISLoginForm) => {
                  LoginHandler(values);
                }}
                validationSchema={loginSchema}
              >
                {(props: FormikProps<ISLoginForm>) => {
                  const { values, touched, errors, handleBlur, handleChange } =
                    props;

                  return (
                    <Form onKeyDown={onKeyDown}>
                      <Box sx={{ marginTop: "20px" }}>
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
                            "Login"
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
                        Don't Have an account?
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
                            navigate("/signup");
                          }}
                        >
                          Sign Up
                        </Box>
                      </Box>
                    </Form>
                  );
                }}
              </Formik>
              </Box>
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

export default Login;
