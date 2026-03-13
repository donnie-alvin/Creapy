// React Imports
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// MUI Imports
import { Box, Typography, Chip, CircularProgress } from "@mui/material";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import {
  useDeleteSavedSearchMutation,
  useGetMeQuery,
  useGetMySavedSearchesQuery,
} from "../../redux/api/userApiSlice";
import { useInitiateTenantPremiumMutation } from "../../redux/api/paymentApiSlice";
import { selectedUserPremiumExpiry, setUser } from "../../redux/auth/authSlice";
// Config Imports
import { isPremiumTenant } from "../../config/monetization";
// Component Imports
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const premiumExpiry = useTypedSelector(selectedUserPremiumExpiry);
  const authUser = useTypedSelector((state) => state.auth?.user);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPolling, setShowPolling] = useState(false);
  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const { data: getMeData } = useGetMeQuery(undefined, {
    pollingInterval: showPolling ? 5000 : 0,
  });
  const {
    data: savedSearchesData,
    isLoading: savedSearchesLoading,
    refetch: refetchSavedSearches,
  } =
    useGetMySavedSearchesQuery(undefined);

  const [deleteSavedSearch, { isLoading: isDeletingSavedSearch }] =
    useDeleteSavedSearchMutation();
  const [initiateTenantPremium, { isLoading: isInitiatingPremium }] =
    useInitiateTenantPremiumMutation();

  const premiumAmountRaw = process.env.REACT_APP_TENANT_PREMIUM_AMOUNT || "10";
  const premiumAmountNumber = Number(premiumAmountRaw);
  const premiumAmountDisplay = Number.isFinite(premiumAmountNumber)
    ? premiumAmountNumber.toFixed(2)
    : "10.00";
  const premiumActive = isPremiumTenant({ premiumExpiry });
  const daysRemaining = premiumExpiry
    ? Math.ceil((new Date(premiumExpiry).getTime() - Date.now()) / 86_400_000)
    : null;
  const showRenew =
    premiumActive && daysRemaining !== null && daysRemaining <= 7;
  const formattedPremiumExpiry = premiumExpiry
    ? new Date(premiumExpiry).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  useEffect(() => {
    if (!showPolling) return;

    const updatedUser = getMeData?.data?.user;
    if (!updatedUser) return;

    const previousExpiryMs = premiumExpiry
      ? new Date(premiumExpiry).getTime()
      : 0;
    const updatedExpiryMs = updatedUser?.premiumExpiry
      ? new Date(updatedUser.premiumExpiry).getTime()
      : 0;

    const hasExpiryUpdate =
      updatedExpiryMs > Date.now() &&
      updatedExpiryMs > previousExpiryMs &&
      updatedExpiryMs !== previousExpiryMs;

    if (hasExpiryUpdate) {
      const nextAuthUser = {
        ...authUser,
        data: {
          ...(authUser?.data || {}),
          user: updatedUser,
        },
      };

      dispatch(setUser(nextAuthUser));
      localStorage.setItem("user", JSON.stringify(nextAuthUser));

      setShowPolling(false);
      setShowPaymentForm(false);
      setPhone("");
      setToast({
        message: "Premium activated!",
        appearence: true,
        type: "success",
      });
    }
  }, [getMeData, showPolling, premiumExpiry, authUser, dispatch]);

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  const handleInitiatePremium = async () => {
    try {
      const result: any = await initiateTenantPremium({ phone });

      if (result?.error) {
        setToast({
          message:
            result?.error?.data?.message ||
            result?.error?.message ||
            "Failed to initiate premium payment",
          appearence: true,
          type: "error",
        });
        return;
      }

      setShowPolling(true);
      setToast({
        message: "Payment request sent. Approve the prompt on your phone.",
        appearence: true,
        type: "info",
      });
    } catch (error) {
      console.error("Initiate Tenant Premium Error", error);
      setToast({
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await deleteSavedSearch(id).unwrap();
      await refetchSavedSearches();
      setToast({
        message: "Saved search deleted successfully",
        appearence: true,
        type: "success",
      });
    } catch (error) {
      console.error("Delete Saved Search Error", error);
      setToast({
        message:
          (error as any)?.data?.message ||
          (error as any)?.message ||
          "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ mt: { xs: 5, md: 6 } }}>
      <AppContainer>
        <Typography variant="h5">Tenant Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your premium plan and saved searches.
        </Typography>

        <AppCard sx={{ mt: "20px", p: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6">Premium Membership</Typography>
          {premiumActive ? (
            <Box sx={{ marginTop: "12px" }}>
              <Chip label="Premium Active" color="success" size="small" />
              <Typography color="text.secondary" sx={{ marginBottom: "14px" }}>
                Active until: {formattedPremiumExpiry}
              </Typography>
              <Typography color="text.secondary" sx={{ marginBottom: "14px" }}>
                {daysRemaining !== null
                  ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
                  : "Expiry not available"}
              </Typography>
              {showRenew ? (
                <AppButton onClick={() => setShowPaymentForm(true)}>
                  Renew Premium
                </AppButton>
              ) : null}
            </Box>
          ) : (
            <Box sx={{ marginTop: "12px" }}>
              <Chip label="No Premium" color="default" size="small" />
              <Typography color="text.secondary" sx={{ marginBottom: "14px" }}>
                Upgrade to Premium for early access to new listings.
              </Typography>
              {!showPaymentForm ? (
                <AppButton onClick={() => setShowPaymentForm(true)}>
                  Upgrade to Premium
                </AppButton>
              ) : null}
            </Box>
          )}
          {showPaymentForm ? (
            <Box sx={{ marginTop: "12px" }}>
              <Typography color="text.secondary" sx={{ marginBottom: "10px" }}>
                Premium price: USD {premiumAmountDisplay}
              </Typography>
              <Typography color="text.secondary" sx={{ marginBottom: "10px" }}>
                Duration: 30-day membership
              </Typography>
              {showPolling ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    py: 1,
                  }}
                >
                  <CircularProgress size={26} />
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: "13px", textAlign: "center" }}
                  >
                    Waiting for payment confirmation. Checking every 5 seconds...
                  </Typography>
                </Box>
              ) : null}
              {!showPolling ? (
                <>
                  <Box sx={{ mt: 1.5 }}>
                    <PrimaryInput
                      label="Your EcoCash Number"
                      type="tel"
                      placeholder="+263 77 123 4567"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </Box>
                  <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
                    <AppButton
                      onClick={handleInitiatePremium}
                      disabled={isInitiatingPremium}
                    >
                      Send Payment Request
                    </AppButton>
                    <AppButton
                      variant="outlined"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setShowPolling(false);
                      }}
                    >
                      Cancel
                    </AppButton>
                  </Box>
                </>
              ) : null}
            </Box>
          ) : null}
        </AppCard>

        <AppCard sx={{ mt: "20px", p: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6" sx={{ marginBottom: "10px" }}>
            Saved Searches
          </Typography>
          {savedSearchesLoading ? (
            <Typography color="text.secondary">Loading saved searches...</Typography>
          ) : savedSearchesData?.data?.length === 0 ? (
            <Typography color="text.secondary">
              No saved searches yet. Use the search page to save a search.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {savedSearchesData?.data?.map((search: any) => (
                <Box
                  key={search?._id}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {search?.name || "Saved Search"}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "13px" }}>
                      Location: {search?.criteria?.location || "Any location"} | Rent:{" "}
                      {search?.criteria?.minRent && search?.criteria?.maxRent
                        ? `${search.criteria.minRent} - ${search.criteria.maxRent}`
                        : search?.criteria?.minRent
                        ? `Min ${search.criteria.minRent}`
                        : search?.criteria?.maxRent
                        ? `Max ${search.criteria.maxRent}`
                        : "Any"}{" "}
                      | Min beds: {search?.criteria?.minBedrooms || "Any"} | Amenities:{" "}
                      {Object.keys(search?.criteria?.amenities || {})
                        .filter((key) => search?.criteria?.amenities?.[key] === true)
                        .join(", ") || "None"}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "13px" }}>
                      Last notified:{" "}
                      {search?.lastNotifiedAt
                        ? new Date(search.lastNotifiedAt).toLocaleString()
                        : "Never"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <AppButton
                      size="small"
                      variant="outlined"
                      onClick={() => navigate("/search")}
                    >
                      View
                    </AppButton>
                    <AppButton
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={isDeletingSavedSearch}
                      onClick={() => handleDeleteSavedSearch(search?._id)}
                    >
                      Delete
                    </AppButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
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
};

export default TenantDashboard;
