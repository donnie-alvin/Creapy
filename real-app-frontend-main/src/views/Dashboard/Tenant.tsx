// React Imports
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// MUI Imports
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Grid,
} from "@mui/material";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import {
  useDeleteSavedSearchMutation,
  useGetMeQuery,
  useGetMySavedSearchesQuery,
} from "../../redux/api/userApiSlice";
import { useInitiateTenantPremiumMutation } from "../../redux/api/paymentApiSlice";
import {
  selectedUserPremiumExpiry,
  setUser,
  selectedUserName,
} from "../../redux/auth/authSlice";
// Config Imports
import { isPremiumTenant } from "../../config/monetization";
// Component Imports
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
// utils
import { convertToFormattedDate } from "../../utils";
// react-icons
import {
  MdSearch,
  MdDelete,
  MdStar,
  MdCalendarToday,
  MdBookmark,
} from "react-icons/md";

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
  } = useGetMySavedSearchesQuery(undefined);

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
  const showRenew = premiumActive && daysRemaining !== null && daysRemaining <= 7;
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

    const previousExpiryMs = premiumExpiry ? new Date(premiumExpiry).getTime() : 0;
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
            result?.error?.data?.message || result?.error?.message ||
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
          (error as any)?.data?.message || (error as any)?.message ||
          "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  // derived for greeting
  const username = useTypedSelector(selectedUserName);
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        {/* welcome header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "22px", color: "#1F2937" }}>
              {greeting}, {username} 👋
            </Typography>
            <Typography sx={{ color: "#4B5563", fontSize: "14px" }}>
              Manage your premium plan and saved searches
            </Typography>
          </Box>
        </Box>

        {/* KPI cards */}
        <Grid container spacing={2} sx={{ marginBottom: "28px" }}>
          <Grid item xs={6} md={4}>
            <AppCard
              sx={{ padding: "20px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
            >
              <Box sx={{ width: "40px", height: "40px", borderRadius: "8px", background: premiumActive ? "#dcfce7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <MdStar size={20} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}>
                {premiumActive ? "Active" : "Inactive"}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>Premium Status</Typography>
              <Box sx={{ background: "#f1f5f9", borderRadius: "999px", padding: "4px 10px", fontSize: "12px", display: "inline-block", marginTop: "8px" }}>
                {premiumActive ? "Active plan" : "No plan"}
              </Box>
            </AppCard>
          </Grid>
          <Grid item xs={6} md={4}>
            <AppCard sx={{ padding: "20px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
              <Box sx={{ width: "40px", height: "40px", borderRadius: "8px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <MdCalendarToday size={20} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}>{daysRemaining ?? "—"}</Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>Days Remaining</Typography>
              <Box sx={{ background: "#f1f5f9", borderRadius: "999px", padding: "4px 10px", fontSize: "12px", display: "inline-block", marginTop: "8px" }}>
                {premiumExpiry ? `Expires ${formattedPremiumExpiry}` : "No active plan"}
              </Box>
            </AppCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <AppCard sx={{ padding: "20px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
              <Box sx={{ width: "40px", height: "40px", borderRadius: "8px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <MdBookmark size={20} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}>{savedSearchesData?.data?.length ?? 0}</Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>Saved Searches</Typography>
              <Box sx={{ background: "#f1f5f9", borderRadius: "999px", padding: "4px 10px", fontSize: "12px", display: "inline-block", marginTop: "8px" }}>Active alerts</Box>
            </AppCard>
          </Grid>
        </Grid>

        {/* Premium membership card */}
        {premiumActive ? (
          <Box sx={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2B6A50 100%)", borderRadius: "16px", padding: "28px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, marginBottom: "28px" }}>
            <Box>
              <Box sx={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", display: "inline-block", marginBottom: "10px" }}>⭐ Premium Active</Box>
              <Typography sx={{ fontSize: "20px", fontWeight: 700 }}>You have early access to new listings</Typography>
              <Typography sx={{ opacity: 0.85, fontSize: "14px" }}>See new properties 24 hours before everyone else</Typography>
              <Typography sx={{ opacity: 0.7, fontSize: "13px", marginTop: "6px" }}>Expires: {formattedPremiumExpiry} · {daysRemaining} days remaining</Typography>
            </Box>
            <Box>{showRenew && (<AppButton onClick={() => setShowPaymentForm(true)} sx={{ background: "#fff", color: "#1F4D3A", borderRadius: "999px" }}>Renew Premium</AppButton>)}</Box>
          </Box>
        ) : (
          <Box sx={{ background: "#fff", borderRadius: "16px", padding: "28px", border: "2px dashed #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, marginBottom: "28px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <Box>
              <Box sx={{ background: "#f1f5f9", color: "#64748b", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", display: "inline-block", marginBottom: "10px" }}>🔒 No Premium</Box>
              <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#1F2937" }}>Unlock Early Access to New Listings</Typography>
              <Typography sx={{ color: "#6b7280", fontSize: "14px" }}>Get 24-hour early access to new listings before they go public</Typography>
              <Typography sx={{ color: "#6b7280", fontSize: "13px", marginTop: "6px" }}>USD {premiumAmountDisplay} / 30 days</Typography>
            </Box>
            <Box>{!showPaymentForm && (<AppButton onClick={() => setShowPaymentForm(true)}>Upgrade to Premium</AppButton>)}</Box>
          </Box>
        )}

        {/* payment form outside card */}
        {showPaymentForm && (
          <AppCard sx={{ padding: "20px", borderRadius: "14px", marginBottom: "28px" }}>
            <Typography color="text.secondary" sx={{ marginBottom: "10px" }}>Premium price: USD {premiumAmountDisplay}</Typography>
            <Typography color="text.secondary" sx={{ marginBottom: "10px" }}>Duration: 30-day membership</Typography>
            {showPolling ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 1 }}>
                <CircularProgress size={26} />
                <Typography color="text.secondary" sx={{ fontSize: "13px", textAlign: "center" }}>Waiting for payment confirmation. Checking every 5 seconds...</Typography>
              </Box>
            ) : null}
            {!showPolling && (
              <>
                <PrimaryInput label="Your EcoCash Number" type="tel" placeholder="+263 77 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
                <Box sx={{ marginTop: "12px", display: "flex", gap: 1 }}>
                  <AppButton onClick={handleInitiatePremium} disabled={isInitiatingPremium}>Send Payment Request</AppButton>
                  <AppButton variant="outlined" onClick={() => { setShowPaymentForm(false); setShowPolling(false); }}>Cancel</AppButton>
                </Box>
              </>
            )}
          </AppCard>
        )}

        {/* Saved Searches section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "16px" }}>Saved Searches</Typography>
          <Typography sx={{ fontSize: "13px", color: "#1F4D3A", cursor: "pointer" }} onClick={() => navigate("/search")}>→ Search</Typography>
        </Box>
        {savedSearchesLoading ? (
          <Typography color="text.secondary">Loading saved searches...</Typography>
        ) : savedSearchesData?.data?.length === 0 ? (
          <Typography color="#6b7280">No saved searches yet. Use the search page to save a search.</Typography>
        ) : (
          <TableContainer component={AppCard} sx={{ borderRadius: "14px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <Table>
              <TableHead sx={{ background: "#f8fafc" }}>
                <TableRow>
                  {["Name", "Criteria", "Last Notified", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {savedSearchesData?.data?.map((search: any) => (
                  <TableRow key={search._id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{search.name || "Saved Search"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>{`${search.criteria?.location} · $${search.criteria?.minRent}–${search.criteria?.maxRent} · ${search.criteria?.minBedrooms}+ beds`}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>{search.lastNotifiedAt ? convertToFormattedDate(search.lastNotifiedAt) : "Never"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View"><IconButton onClick={() => navigate("/search")}><MdSearch size={18} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton color="error" disabled={isDeletingSavedSearch} onClick={() => handleDeleteSavedSearch(search._id)}><MdDelete size={18} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppContainer>

      <ToastAlert appearence={toast.appearence} type={toast.type} message={toast.message} handleClose={handleCloseToast} />
    </Box>
  );
};

export default TenantDashboard;
