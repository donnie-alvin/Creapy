// React Imports
import { useNavigate } from "react-router-dom";
// MUI Imports
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Avatar,
  Typography,
  Grid,
} from "@mui/material";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import { selectedUserId, selectedUserName } from "../../redux/auth/authSlice";

// react-icons
import {
  MdEdit,
  MdDelete,
  MdCheckCircle,
  MdHourglassEmpty,
  MdAttachMoney,
  MdListAlt,
} from "react-icons/md";
import {
  useDeleteListingMutation,
  useGetListingQuery,
} from "../../redux/api/listingApiSlice";
import { useGetMyPaymentsQuery } from "../../redux/api/paymentApiSlice";
// Utils Imports
import { convertToFormattedDate } from "../../utils";
// Component Imports
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import { Heading } from "../../components/Heading";
import OverlayLoader from "../../components/Spinner/OverlayLoader";

const getListingStatusBadge = (status: string) => {
  if (status === "pending_payment") {
    return (
      <Box
        sx={{
          background: "#fef3c7",
          color: "#92400e",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        Pending Payment
      </Box>
    );
  }

  if (status === "early_access") {
    return (
      <Box
        sx={{
          background: "#dbeafe",
          color: "#1e40af",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        Early Access
      </Box>
    );
  }

  if (status === "active") {
    return (
      <Box
        sx={{
          background: "#dcfce7",
          color: "#166534",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        Active
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "#f1f5f9",
        color: "#64748b",
        borderRadius: "999px",
        padding: "6px 12px",
        fontSize: "12px",
        display: "inline-block",
      }}
    >
      Inactive
    </Box>
  );
};

const getPaymentStatusBadge = (status: string) => {
  if (status === "pending") {
    return (
      <Box
        sx={{
          background: "#fef3c7",
          color: "#92400e",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        Pending
      </Box>
    );
  }

  if (status === "success") {
    return (
      <Box
        sx={{
          background: "#dcfce7",
          color: "#166534",
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        Success
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "#fee2e2",
        color: "#991b1b",
        borderRadius: "999px",
        padding: "6px 12px",
        fontSize: "12px",
        display: "inline-block",
      }}
    >
      Failed
    </Box>
  );
};

const LandlordDashboard = () => {
  const userId = useTypedSelector(selectedUserId);
  const navigate = useNavigate();

  // derived values for UI
  const username = useTypedSelector(selectedUserName);
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";

  const { data: listingsData, isLoading: listingsLoading } = useGetListingQuery(userId);
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const { data: paymentsData, isLoading: paymentsLoading } =
    useGetMyPaymentsQuery(undefined);

  const totalListings = listingsData?.data?.length ?? 0;
  const activeCount =
    listingsData?.data?.filter(
      (l: any) => l.status === "active" || l.status === "early_access"
    ).length ?? 0;
  const pendingCount =
    listingsData?.data?.filter((l: any) => l.status === "pending_payment").length ?? 0;
  const totalRevenue =
    paymentsData?.data
      ?.filter((p: any) => p.status === "success")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ?? 0;

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
            <Typography
              sx={{ fontWeight: 700, fontSize: "22px", color: "#1F2937" }}
            >
              {greeting}, {username} 👋
            </Typography>
            <Typography sx={{ color: "#4B5563", fontSize: "14px" }}>
              Manage your listings and track your payments
            </Typography>
          </Box>
          <AppButton onClick={() => navigate("/create-listing")}>+ Create New Listing</AppButton>
        </Box>

        {/* KPI cards */}
        <Grid container spacing={2} sx={{ marginBottom: "28px" }}>
          <Grid item xs={6} md={3}>
            <AppCard
              sx={{
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <MdListAlt size={20} />
              </Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}
              >
                {totalListings}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                Total Listings
              </Typography>
              <Box
                sx={{
                  background: "#f1f5f9",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  display: "inline-block",
                  marginTop: "8px",
                }}
              >
                All listings
              </Box>
            </AppCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <AppCard
              sx={{
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <MdCheckCircle size={20} />
              </Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}
              >
                {activeCount}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                Active
              </Typography>
              <Box
                sx={{
                  background: "#f1f5f9",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  display: "inline-block",
                  marginTop: "8px",
                }}
              >
                Live now
              </Box>
            </AppCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <AppCard
              sx={{
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <MdHourglassEmpty size={20} />
              </Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}
              >
                {pendingCount}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                Pending Payment
              </Typography>
              <Box
                sx={{
                  background: "#f1f5f9",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  display: "inline-block",
                  marginTop: "8px",
                }}
              >
                Needs action
              </Box>
            </AppCard>
          </Grid>
          <Grid item xs={6} md={3}>
            <AppCard
              sx={{
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "#f3e8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <MdAttachMoney size={20} />
              </Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "26px", color: "#1F2937" }}
              >
                {totalRevenue}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                Total Revenue
              </Typography>
              <Box
                sx={{
                  background: "#f1f5f9",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  display: "inline-block",
                  marginTop: "8px",
                }}
              >
                USD {totalRevenue}
              </Box>
            </AppCard>
          </Grid>
        </Grid>

        {/* My Listings section */}
        <Typography
          sx={{ fontWeight: 700, fontSize: "16px", marginBottom: "12px" }}
        >
          My Listings
        </Typography>
        {listingsLoading ? (
          <OverlayLoader />
        ) : listingsData?.data?.length === 0 ? (
          <AppCard
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "20px",
              margin: "20px 0",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
            }}
          >
            No listings yet. Create your first listing.
            <AppButton onClick={() => navigate("/create-listing")}>Create Listing</AppButton>
          </AppCard>
        ) : (
          <TableContainer
            component={AppCard}
            sx={{
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              marginBottom: "28px",
            }}
          >
            <Table>
              <TableHead sx={{ background: "#f8fafc" }}>
                <TableRow>
                  {[
                    "Listing",
                    "Location",
                    "Status",
                    "Published",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listingsData?.data?.map((item: any) => (
                  <TableRow
                    key={item._id}
                    hover
                    sx={{ "&:hover": { background: "#f8fafc" } }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        {item.imageUrls?.[0] ? (
                          <img
                            src={item.imageUrls[0]}
                            width={44}
                            height={44}
                            style={{ borderRadius: 8, objectFit: "cover" }}
                            alt=""
                          />
                        ) : (
                          <span>🏠</span>
                        )}
                        <Box>
                          <Typography
                            sx={{
                              color: "#1F4D3A",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onClick={() => navigate(`/listing/${item._id}`)}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "12px", color: "#6b7280" }}
                          >
                            USD {item.price} · {item.bedrooms} beds
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{getListingStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.status === "pending_payment"
                        ? "—"
                        : convertToFormattedDate(
                            item.publishedAt ?? item.createdAt
                          )}
                    </TableCell>
                    <TableCell>
                      {item.status === "pending_payment" ? (
                        <AppButton
                          size="small"
                          onClick={() => navigate(`/listings/${item._id}/pay`)}
                        >
                          Pay Now
                        </AppButton>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => navigate(`/listings/${item._id}`)}
                            >
                              <MdEdit size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => deleteListing(item._id)}
                              disabled={isDeleting}
                            >
                              <MdDelete size={18} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Payment History section */}
        <Typography
          sx={{ fontWeight: 700, fontSize: "16px", marginTop: "28px", marginBottom: "12px" }}
        >
          Payment History
        </Typography>
        {paymentsLoading ? (
          <Box>Loading...</Box>
        ) : paymentsData?.data?.length === 0 ? (
          <AppCard sx={{ width: "100%", padding: "16px 20px", margin: "12px 0" }}>
            No payment history yet.
          </AppCard>
        ) : (
          <TableContainer
            component={AppCard}
            sx={{
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
              marginBottom: "28px",
            }}
          >
            <Table>
              <TableHead sx={{ background: "#f8fafc" }}>
                <TableRow>
                  {["Date", "Listing", "Amount", "Status"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentsData?.data?.map((payment: any) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      {convertToFormattedDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>{payment.listing?.name ?? "—"}</TableCell>
                    <TableCell>USD {payment.amount}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppContainer>
    </Box>
  );
};

export default LandlordDashboard;
