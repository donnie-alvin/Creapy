// React Imports
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// Formik Imports
import { Form, Formik, FormikProps } from "formik";
// Component Imports
import { Heading, SubHeading } from "../../components/Heading";
import { signUpSchema } from "../SignUp/components/validationSchema";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import DotLoader from "../../components/Spinner/dotLoader";
// Utils Imports
import { onKeyDown } from "../../utils";
// Hooks Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// React Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { MdOutlineDeleteSweep } from "react-icons/md";
// Redux Imports
import {
  useDeleteMutation,
  useUpdateMutation,
  useGetMeQuery,
} from "../../redux/api/userApiSlice";
import {
  useGetR2SignedUrlMutation,
  type R2SignedUrlData,
} from "../../redux/api/uploadApiSlice";
import {
  selectedUserAvatar,
  selectedUserName,
  selectedUserEmail,
  setUser,
  selectedUserId,
  selectedUserRole,
  selectedUserToken,
} from "../../redux/auth/authSlice";
// MUI Imports
import { Box, Grid, Tooltip } from "@mui/material";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";

interface ISProfileForm {
  userName: string;
  email: string;
  password: string;
}

// Firebase Storage
// allow read;
// allow write: if
// request.resource.size < 2 * 1024 * 1024 &&
// request.resource.contentType.matches('image/.*')

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileRef = useRef<HTMLInputElement | null | any>(null);

  const userName = useTypedSelector(selectedUserName);
  const userEmail = useTypedSelector(selectedUserEmail);
  const userAvatar = useTypedSelector(selectedUserAvatar);
  const userId = useTypedSelector(selectedUserId);
  const userRole = useTypedSelector(selectedUserRole);
  const token = useTypedSelector(selectedUserToken);
  const authBlob = useTypedSelector((state: any) => state.auth?.user);
  const { data: meData } = useGetMeQuery(undefined, { skip: !userId });
  const [getR2SignedUrl] = useGetR2SignedUrlMutation();

  // states
  const [file, setFile] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [filePercentage, setFilePercentage] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formValues, setFormValues] = useState<ISProfileForm>({
    userName,
    email: userEmail,
    password: "",
  });
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleFileUpload = async (file: File) => {
    if (!token) {
      setToast({
        ...toast,
        message: "Session expired. Please log in again.",
        appearence: true,
        type: "error",
      });
      navigate("/login");
      return;
    }

    let result: R2SignedUrlData;

    try {
      result = await getR2SignedUrl({
        contentType: file.type,
        folder: "avatars",
      }).unwrap();
    } catch (error: any) {
      console.error(error);

      if (error?.status === 401 || error?.originalStatus === 401) {
        setToast({
          ...toast,
          message: "Session expired. Please log in again.",
          appearence: true,
          type: "error",
        });
        navigate("/login");
        setFileUploadError(true);
        return;
      }

      setFileUploadError(true);
      return;
    }

    try {
      const { uploadUrl, publicUrl } = result;

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) throw new Error("R2 upload failed");

      setFormData({ ...formData, avatar: publicUrl });
      setFile(null);
      setFilePercentage(100);
    } catch (e) {
      console.error(e);
      setFileUploadError(true);
    }
  };

  const hideShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  // Update Profile API bind
  const [updateProfile, { isLoading }] = useUpdateMutation();

  const ProfileHandler = async (data: ISProfileForm) => {
    const payload = {
      username: data.userName,
      email: data.email,
      password: data.password,
      avatar: formData.avatar || userAvatar,
    };

    try {
      const user: any = await updateProfile({
        id: userId,
        payload,
      });
      if (user?.data?.status) {
        setToast({
          ...toast,
          message: "User Updated Successfully",
          appearence: true,
          type: "success",
        });
        dispatch(setUser(user?.data));
        localStorage.setItem("user", JSON.stringify(user?.data));
        navigate("/");
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
      console.error("Profile Upload Error:", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  // Delete Account API bind
  const [deleteAccount, { isLoading: deleteLoading }] = useDeleteMutation();

  const deleteHandler = async () => {
    try {
      const user: any = await deleteAccount(userId);
      if (user?.data === null) {
        setToast({
          ...toast,
          message: "Account Deleted Successfully",
          appearence: true,
          type: "success",
        });
        dispatch(setUser(null));
        localStorage.removeItem("user");
        navigate("/login");
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
      console.error("Delete Account Error:", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ mt: { xs: 5, md: 6 } }}>
      <AppContainer>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} md={7} lg={6}>
            <AppCard sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <Heading sx={{ fontSize: "30px" }}>Profile</Heading>
                <Tooltip title="Upload Image" placement="right">
                  <Box sx={{ marginTop: "30px", cursor: "pointer" }}>
                    <input
                      onChange={(e) => {
                        if (e.target.files) {
                          setFile(e.target.files[0]);
                        }
                      }}
                      hidden
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      name=""
                      id=""
                    />
                    <img
                      onClick={() => fileRef.current.click()}
                      height={95}
                      width={95}
                      src={formData.avatar || userAvatar}
                      alt="user"
                      style={{ borderRadius: "50%" }}
                    />
                  </Box>
                </Tooltip>
                <Box sx={{ marginTop: "7px" }}>
                  {fileUploadError ? (
                    <Box sx={{ color: "#d32f2f", fontWeight: 400 }}>
                      File Upload Error
                      <span style={{ marginLeft: "3px" }}>
                        (Image be less than 2Mb)
                      </span>
                    </Box>
                  ) : filePercentage > 0 && filePercentage < 100 ? (
                    <Box
                      sx={{ color: "#334155", fontweight: 400 }}
                    >{`Uploading ${filePercentage}%`}</Box>
                  ) : filePercentage === 100 ? (
                    <Box sx={{ color: "#1db45a", fontWeight: 500 }}>
                      Image Successfully Uploaded!
                    </Box>
                  ) : (
                    ""
                  )}
                </Box>
              </Box>

              <Box sx={{ width: "100%" }}>
                <Formik
                  initialValues={formValues}
                  onSubmit={(values: ISProfileForm) => {
                    ProfileHandler(values);
                  }}
                  validationSchema={signUpSchema}
                >
                  {(props: FormikProps<ISProfileForm>) => {
                    const { values, touched, errors, handleBlur, handleChange } =
                      props;

                    return (
                      <Form onKeyDown={onKeyDown}>
                        <Box sx={{ minHeight: "72px", marginTop: "20px" }}>
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
                        <Box sx={{ minHeight: "72px" }}>
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
                        <Box sx={{ minHeight: "72px" }}>
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
                            justifyContent: "flex-end",
                            marginTop: "16px",
                          }}
                        >
                          <AppButton
                            type="submit"
                            fullWidth
                            disabled={isLoading}
                            sx={{ margin: "0 0 20px 0" }}
                          >
                            {isLoading ? (
                              <DotLoader color="#fff" size={12} />
                            ) : (
                              "Update"
                            )}
                          </AppButton>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <AppButton
                            variant="outlined"
                            color="error"
                            disabled={deleteLoading}
                            startIcon={<MdOutlineDeleteSweep />}
                            onClick={deleteHandler}
                          >
                            Delete Account
                          </AppButton>
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

export default Profile;
