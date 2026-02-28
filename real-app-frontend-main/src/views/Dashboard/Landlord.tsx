// React Imports
import { useNavigate } from "react-router-dom";
// MUI Imports
import { Box } from "@mui/material";
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
          <>
            {listingsData?.data?.map((item: any) => (
              <AppCard
                sx={{
                  width: "100%",
                  padding: "20px",
                  margin: "20px 0",
                }}
                key={item?._id}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#49454F",
                      "&:hover": {
                        cursor: "pointer",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={() => {
                      navigate(`/listing/${item?._id}`);
                    }}
                  >
                    {item?.name}
                  </Box>
                  {getListingStatusBadge(item?.status)}
                </Box>

                <Box
                  sx={{
                    color: "#64748b",
                    fontSize: "13px",
                    marginTop: "6px",
                  }}
                >
                  Published: {convertToFormattedDate(item?.publishedAt ?? item?.createdAt)}
                </Box>

                <Box
                  sx={{
                    marginTop: "12px",
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {item?.status === "pending_payment" ? (
                    <AppButton
                      variant="contained"
                      onClick={() => navigate(`/listings/${item?._id}/pay`)}
                    >
                      Pay Now
                    </AppButton>
                  ) : (
                    <>
                      <AppButton
                        variant="outlined"
                        color="success"
                        onClick={() => navigate(`/listings/${item?._id}`)}
                      >
                        Edit
                      </AppButton>
                      <AppButton
                        variant="outlined"
                        color="error"
                        onClick={() => deleteListing(item?._id)}
                        disabled={isDeleting}
                      >
                        Delete
                      </AppButton>
                    </>
                  )}
                </Box>
              </AppCard>
            ))}
          </>
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
          <>
            {paymentsData?.data?.map((payment: any) => (
              <AppCard
                sx={{ width: "100%", padding: "16px 20px", margin: "12px 0" }}
                key={payment?._id}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box>{convertToFormattedDate(payment?.createdAt)}</Box>
                  <Box>{payment?.listing?.name ?? "—"}</Box>
                  <Box>USD {payment?.amount}</Box>
                  {getPaymentStatusBadge(payment?.status)}
                </Box>
              </AppCard>
            ))}
          </>
        )}
      </AppContainer>
    </Box>
  );
};

export default LandlordDashboard;
