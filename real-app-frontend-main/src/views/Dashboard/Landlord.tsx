// React Imports
import { useNavigate } from "react-router-dom";
// MUI Imports
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import { selectedUserId } from "../../redux/auth/authSlice";
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

  const { data: listingsData, isLoading: listingsLoading } = useGetListingQuery(userId);
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const { data: paymentsData, isLoading: paymentsLoading } =
    useGetMyPaymentsQuery(undefined);

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Heading>My Listings</Heading>
          <AppButton onClick={() => navigate("/create-listing")}>
            + Create New Listing
          </AppButton>
        </Box>

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
            <AppButton onClick={() => navigate("/create-listing")}>
              Create Listing
            </AppButton>
          </AppCard>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["Listing", "Location", "Status", "Published", "Actions"].map(
                    (header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        {header}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {listingsData?.data?.map((item: any) => (
                  <TableRow
                    key={item?._id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          fontWeight: 600,
                          color: "#1F4D3A",
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                        onClick={() => {
                          navigate(`/listing/${item?._id}`);
                        }}
                      >
                        {item?.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {item?.location ?? "—"}
                    </TableCell>
                    <TableCell>{getListingStatusBadge(item?.status)}</TableCell>
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {item?.publishedAt
                        ? convertToFormattedDate(item?.publishedAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {item?.status === "pending_payment" ? (
                        <AppButton
                          variant="contained"
                          onClick={() => navigate(`/listings/${item?._id}/pay`)}
                        >
                          Pay Now
                        </AppButton>
                      ) : (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/listings/${item?._id}`)}
                              sx={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            >
                              ✏️
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => deleteListing(item?._id)}
                              disabled={isDeleting}
                              sx={{
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                color: "#dc2626",
                                "&:hover": {
                                  background: "#fef2f2",
                                },
                              }}
                            >
                              🗑️
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Heading sx={{ marginTop: "40px", marginBottom: "16px" }}>
          Payment History
        </Heading>

        {paymentsLoading ? (
          <Box>Loading...</Box>
        ) : paymentsData?.data?.length === 0 ? (
          <AppCard sx={{ width: "100%", padding: "16px 20px", margin: "12px 0" }}>
            No payment history yet.
          </AppCard>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["Date", "Listing", "Amount", "Status"].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentsData?.data?.map((payment: any) => (
                  <TableRow
                    key={payment?._id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {convertToFormattedDate(payment?.createdAt)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: "14px" }}>
                      {payment?.listing?.name ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px" }}>
                      USD {payment?.amount}
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(payment?.status)}</TableCell>
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
