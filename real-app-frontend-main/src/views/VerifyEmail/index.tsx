import { Box, CircularProgress } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppButton from "../../components/ui/AppButton";
import AppCard from "../../components/ui/AppCard";
import AppContainer from "../../components/ui/AppContainer";
import { Heading, SubHeading } from "../../components/Heading";
import { useVerifyEmailQuery } from "../../redux/api/authApiSlice";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const { data, error, isLoading } = useVerifyEmailQuery(token, {
    skip: !token,
  });

  const errorMessage =
    (error as any)?.data?.message ||
    (!token ? "Verification token is missing." : "Unable to verify your email.");

  return (
    <Box sx={{ margin: "70px 0" }}>
      <AppContainer>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", maxWidth: 520 }}>
            <AppCard sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
              {isLoading ? (
                <>
                  <CircularProgress sx={{ color: "#1F4D3A", mb: 2 }} />
                  <Heading sx={{ fontSize: "28px", marginBottom: "8px" }}>
                    Verifying your email
                  </Heading>
                  <SubHeading>We are confirming your account now.</SubHeading>
                </>
              ) : data?.status === "success" ? (
                <>
                  <Heading sx={{ fontSize: "28px", marginBottom: "8px" }}>
                    Email verified
                  </Heading>
                  <SubHeading sx={{ marginBottom: "20px" }}>
                    {data?.message || "Your email is verified. You can now log in."}
                  </SubHeading>
                  <AppButton onClick={() => navigate("/login")}>Go to Login</AppButton>
                </>
              ) : (
                <>
                  <Heading sx={{ fontSize: "28px", marginBottom: "8px" }}>
                    Verification failed
                  </Heading>
                  <SubHeading sx={{ marginBottom: "20px" }}>
                    {errorMessage}
                  </SubHeading>
                  <AppButton onClick={() => navigate("/signup")}>Back to Sign Up</AppButton>
                </>
              )}
            </AppCard>
          </Box>
        </Box>
      </AppContainer>
    </Box>
  );
};

export default VerifyEmail;
