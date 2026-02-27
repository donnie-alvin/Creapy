// React Imports
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// MUI Imports
import { Box, CircularProgress, Typography } from "@mui/material";
// Redux Imports
import { useGetSingleListingQuery } from "../../redux/api/listingApiSlice";
import { useInitiateListingFeeMutation } from "../../redux/api/paymentApiSlice";
import { selectedUserId } from "../../redux/auth/authSlice";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Component Imports
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import DotLoader from "../../components/Spinner/dotLoader";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
// React Icons
import { FaCheckCircle } from "react-icons/fa";

const ListingPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = useTypedSelector(selectedUserId);

  const [uiState, setUiState] = useState<"idle" | "polling" | "success">(
    "idle"
  );
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [instructions, setInstructions] = useState("");
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const { data, isLoading } = useGetSingleListingQuery(id as string, {
    skip: !id,
    pollingInterval: uiState === "polling" ? 5000 : 0,
  });

  const [initiateListingFee, { isLoading: isInitiating }] =
    useInitiateListingFeeMutation();

  const listing = data?.data;
  const feeAmount = process.env.REACT_APP_LISTING_FEE_AMOUNT || "5";
  const isOwner = listing?.user === userId || listing?.user?._id === userId;

  useEffect(() => {
    if (
      uiState !== "success" &&
      (listing?.status === "early_access" || listing?.status === "active")
    ) {
      setUiState("success");
    }
  }, [data, uiState]);

  useEffect(() => {
    if (uiState === "success") {
      const timer = setTimeout(() => {
        navigate("/dashboard/landlord");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [uiState]);

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, appearence: false }));
  };

  const handleSubmit = async () => {
    try {
      const payload: any = await initiateListingFee({
        listingId: id,
        phone,
      }).unwrap();
      setTransactionRef(payload?.data?.transactionRef || "");
      setInstructions(payload?.data?.instructions || "");
      setUiState("polling");
    } catch (error: any) {
      setToast({
        message:
          error?.data?.message ||
          error?.message ||
          "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ marginTop: "50px" }}>
        <OverlayLoader />
      </Box>
    );
  }

  if (!listing) {
    return (
      <Box sx={{ marginTop: "50px" }}>
        <AppContainer>
          <AppCard sx={{ p: { xs: 2, md: 3 }, maxWidth: 500, mx: "auto" }}>
            <Typography sx={{ marginBottom: "16px" }}>
              Listing not found.
            </Typography>
            <AppButton onClick={() => navigate("/dashboard/landlord")}>
              Back to Dashboard
            </AppButton>
          </AppCard>
        </AppContainer>
        <ToastAlert
          appearence={toast.appearence}
          type={toast.type}
          message={toast.message}
          handleClose={handleCloseToast}
        />
      </Box>
    );
  }

  if (!isOwner) {
    return (
      <Box sx={{ marginTop: "50px" }}>
        <AppContainer>
          <AppCard sx={{ p: { xs: 2, md: 3 }, maxWidth: 500, mx: "auto" }}>
            <Typography sx={{ marginBottom: "16px" }}>
              You do not have permission to pay for this listing.
            </Typography>
            <AppButton onClick={() => navigate("/dashboard/landlord")}>
              Back to Dashboard
            </AppButton>
          </AppCard>
        </AppContainer>
        <ToastAlert
          appearence={toast.appearence}
          type={toast.type}
          message={toast.message}
          handleClose={handleCloseToast}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        {uiState === "idle" ? (
          <AppCard
            sx={{
              marginTop: "30px",
              p: { xs: 2, md: 3 },
              maxWidth: 500,
              mx: "auto",
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                background: "#fef3c7",
                color: "#92400e",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              Pending Payment
            </Box>
            <Heading sx={{ marginBottom: "8px" }}>Activate Your Listing</Heading>
            <SubHeading sx={{ marginBottom: "16px" }}>
              Pay the activation fee via EcoCash to publish your listing.
            </SubHeading>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <Box>Listing</Box>
              <Box sx={{ fontWeight: 600 }}>{listing.name}</Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <Box>Activation Fee</Box>
              <Box sx={{ fontWeight: 600 }}>USD {feeAmount}.00</Box>
            </Box>
            <Box sx={{ marginBottom: "16px" }}>
              <PrimaryInput
                label="Your EcoCash Number"
                type="tel"
                placeholder="+263 77 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Box>
            <AppButton fullWidth onClick={handleSubmit} disabled={isInitiating}>
              {isInitiating ? (
                <DotLoader color="#fff" size={10} />
              ) : (
                "Send Payment Request"
              )}
            </AppButton>
          </AppCard>
        ) : null}

        {uiState === "polling" ? (
          <AppCard
            sx={{
              marginTop: "30px",
              p: { xs: 2, md: 3 },
              maxWidth: 500,
              mx: "auto",
              textAlign: "center",
            }}
          >
            <CircularProgress size={52} sx={{ marginBottom: "16px" }} />
            <Typography variant="h6" sx={{ marginBottom: "8px" }}>
              Waiting for EcoCash confirmation...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve the EcoCash prompt on your phone to complete payment.
            </Typography>
            <Box
              sx={{
                background: "#f1f5f9",
                borderRadius: "8px",
                padding: "12px 16px",
                marginTop: "16px",
              }}
            >
              Reference:{" "}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {transactionRef}
              </Box>
            </Box>
            {instructions ? (
              <Typography sx={{ marginTop: "12px" }}>{instructions}</Typography>
            ) : null}
            <Box
              component="ol"
              sx={{ marginTop: "12px", textAlign: "left", paddingLeft: "20px" }}
            >
              <li>You will receive a USSD prompt on your phone</li>
              <li>Enter your EcoCash PIN to approve the payment</li>
              <li>Wait for confirmation below</li>
            </Box>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ marginTop: "12px" }}
            >
              Checking status every 5 seconds...
            </Typography>
          </AppCard>
        ) : null}

        {uiState === "success" ? (
          <AppCard
            sx={{
              marginTop: "30px",
              p: { xs: 2, md: 3 },
              maxWidth: 500,
              mx: "auto",
              textAlign: "center",
            }}
          >
            <FaCheckCircle size={64} color="#16a34a" />
            <Typography variant="h6" sx={{ marginTop: "16px" }}>
              ✓ Payment confirmed! Your listing is now live in Early Access for 24
              hours.
            </Typography>
            <AppButton
              onClick={() => navigate("/dashboard/landlord")}
              sx={{ marginTop: "16px" }}
            >
              Go to Dashboard
            </AppButton>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ marginTop: "12px" }}
            >
              Redirecting to dashboard in 4 seconds...
            </Typography>
          </AppCard>
        ) : null}
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

export default ListingPayment;
