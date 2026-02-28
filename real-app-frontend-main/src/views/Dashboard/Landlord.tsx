// React Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// MUI Imports
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Paper,
} from "@mui/material";
// Hook Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import { selectedUserId } from "../../redux/auth/authSlice";
import {
  useGetListingQuery,
  useDeleteListingMutation,
} from "../../redux/api/listingApiSlice";
import { useGetMyPaymentsQuery } from "../../redux/api/paymentApiSlice";
// Component Imports
import Spinner from "../../components/Spinner";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import AppContainer from "../../components/ui/AppContainer";
import AppButton from "../../components/ui/AppButton";
// Utils Imports
import { convertToFormattedDate } from "../../utils";

const LandlordDashboard = () => {
  const navigate = useNavigate();
  const userId = useTypedSelector(selectedUserId);

  const { data: listingsData, isLoading: listingsLoading } =
    useGetListingQuery(userId);
  const { data: paymentsData, isLoading: paymentsLoading } =
    useGetMyPaymentsQuery();
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  const handleDelete = async (id: string) => {
    try {
      const listing: any = await deleteListing(id);
      if (listing?.data === null) {
        setToast({
          ...toast,
          message: "Listing Deleted Successfully",
          appearence: true,
          type: "success",
        });
      }
      if (listing?.error) {
        setToast({
          ...toast,
          message: listing?.error?.message,
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Delete Listing Error", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  const getListingStatusChip = (status: string) => {
    if (status === "pending_payment") {
      return <Chip color="warning" label="Pending Payment" size="small" />;
    }
    if (status === "early_access") {
      return <Chip color="info" label="Early Access" size="small" />;
    }
    if (status === "active") {
      return <Chip color="success" label="Active" size="small" />;
    }
    if (status === "inactive") {
      return <Chip color="default" label="Inactive" size="small" />;
    }
    return <Chip color="default" label={status || "Unknown"} size="small" />;
  };

  const getPaymentStatusChip = (status: string) => {
    if (status === "pending") {
      return <Chip color="warning" label="Pending" size="small" />;
    }
    if (status === "success") {
      return <Chip color="success" label="Success" size="small" />;
    }
    if (status === "failed") {
      return <Chip color="error" label="Failed" size="small" />;
    }
    return <Chip color="default" label={status || "Unknown"} size="small" />;
  };

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <Typography variant="h5">Landlord Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Landlord account
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 4,
            mb: 1,
          }}
        >
          <Typography variant="h6">My Listings</Typography>
          <AppButton onClick={() => navigate("/create-listing")}>
            + Create New Listing
          </AppButton>
        </Box>

        {listingsLoading ? (
          <Spinner />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Listing Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Published Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listingsData?.data?.map((listing: any) => (
                  <TableRow key={listing._id}>
                    <TableCell>{listing.name}</TableCell>
                    <TableCell>{getListingStatusChip(listing.status)}</TableCell>
                    <TableCell>
                      {listing.status === "pending_payment"
                        ? "—"
                        : convertToFormattedDate(listing.createdAt)}
                    </TableCell>
                    <TableCell>
                      {listing.status === "pending_payment" && (
                        <AppButton
                          size="small"
                          color="warning"
                          onClick={() => navigate(`/listings/${listing._id}/pay`)}
                        >
                          Pay Now
                        </AppButton>
                      )}
                      {(listing.status === "early_access" ||
                        listing.status === "active") && (
                        <>
                          <AppButton
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/listings/${listing._id}`)}
                          >
                            Edit
                          </AppButton>
                          <AppButton
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={isDeleting}
                            onClick={() => handleDelete(listing._id)}
                            sx={{ ml: 1 }}
                          >
                            Delete
                          </AppButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="h6" sx={{ mt: 5, mb: 1 }}>
          Payment History
        </Typography>

        {paymentsLoading ? (
          <Spinner />
        ) : paymentsData?.data?.length === 0 ? (
          <Typography color="text.secondary">No payments yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Listing</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentsData?.data?.map((payment: any) => (
                  <TableRow key={payment._id}>
                    <TableCell>{convertToFormattedDate(payment.createdAt)}</TableCell>
                    <TableCell>{payment.listing?.name ?? "—"}</TableCell>
                    <TableCell>USD {payment.amount?.toFixed(2)}</TableCell>
                    <TableCell>{getPaymentStatusChip(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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

export default LandlordDashboard;
