import { useState } from "react";
import { Box, Link } from "@mui/material";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppContainer from "../../components/ui/AppContainer";
import { Heading, SubHeading } from "../../components/Heading";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import DotLoader from "../../components/Spinner/dotLoader";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import {
  useResendPhoneOtpMutation,
  useVerifyPhoneMutation,
} from "../../redux/api/authApiSlice";
import { setUser } from "../../redux/auth/authSlice";

const VerifyPhone = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const email =
    (location.state as { email?: string } | null)?.email ||
    JSON.parse(localStorage.getItem("user") || "null")?.data?.user?.email ||
    "";

  const [verifyPhone, { isLoading }] = useVerifyPhoneMutation();
  const [resendPhoneOtp, { isLoading: isResending }] = useResendPhoneOtpMutation();

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, appearence: false }));
  };

  const handleVerify = async () => {
    try {
      const trimmedOtp = otp.trim();

      if (!email) {
        setToast({
          message: "We couldn't determine which account to verify. Please sign up again.",
          appearence: true,
          type: "error",
        });
        return;
      }

      if (!/^\d{6}$/.test(trimmedOtp)) {
        setToast({
          message: "Please enter a valid 6-digit code",
          appearence: true,
          type: "error",
        });
        return;
      }

      const response: any = await verifyPhone({ otp: trimmedOtp, email });

      if (response?.data?.status === "success") {
        dispatch(setUser(response.data));
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/dashboard/landlord");
        return;
      }

      if (response?.error) {
        setToast({
          message: response?.error?.data?.message || "Unable to verify phone number.",
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  const handleResend = async () => {
    try {
      const response: any = await resendPhoneOtp({ email });

      if (response?.data?.status === "success") {
        setToast({
          message: response?.data?.message || "OTP resent.",
          appearence: true,
          type: "success",
        });
        return;
      }

      if (response?.error) {
        setToast({
          message: response?.error?.data?.message || "Unable to resend OTP.",
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
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
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", maxWidth: 520 }}>
            <AppCard sx={{ p: { xs: 3, md: 4 } }}>
              <Heading sx={{ fontSize: "28px", marginBottom: "8px", textAlign: "center" }}>
                Verify your phone number
              </Heading>
              <SubHeading sx={{ marginBottom: "20px", textAlign: "center" }}>
                Enter the 6-digit code sent to your registered phone number.
              </SubHeading>
              <PrimaryInput
                type="text"
                label=""
                name="otp"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(nextValue);
                }}
                inputProps={{ maxLength: 6 }}
              />
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                {isLoading ? (
                  <DotLoader color="#1F4D3A" size={12} />
                ) : (
                  <AppButton onClick={handleVerify}>Verify</AppButton>
                )}
              </Box>
              <Box sx={{ mt: 2, textAlign: "center" }}>
                {isResending ? (
                  <DotLoader color="#1F4D3A" size={12} />
                ) : (
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={handleResend}
                  >
                    Didn&apos;t receive a code? Resend
                  </Link>
                )}
              </Box>
            </AppCard>
          </Box>
        </Box>
      </AppContainer>
      <ToastAlert
        type={toast.type}
        message={toast.message}
        appearence={toast.appearence}
        handleClose={handleCloseToast}
      />
    </Box>
  );
};

export default VerifyPhone;
