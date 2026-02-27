// React Imports
import { useNavigate, useParams } from "react-router-dom";
// MUI Imports
import { Box } from "@mui/material";
// Component Imports
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";

const ListingPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <Box sx={{ textAlign: "center" }}>
          <Heading>Listing Payment</Heading>
        </Box>
        <AppCard sx={{ marginTop: "30px", p: { xs: 2, md: 3 }, maxWidth: 500, mx: "auto" }}>
          <SubHeading sx={{ marginBottom: "16px" }}>
            Payment for Listing
          </SubHeading>
          <Box sx={{ marginBottom: "16px", color: "#334155" }}>
            Your listing (ID: {id}) is pending payment.
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <AppButton fullWidth onClick={() => navigate(`/listings/${id}`)}>
              Back to Listing
            </AppButton>
            <AppButton
              fullWidth
              variant="contained"
              sx={{
                background: "#1F4D3A",
                "&:hover": { background: "#16382b" },
              }}
              onClick={() => {
                // TODO: Implement payment flow
                alert("Payment flow to be implemented");
              }}
            >
              Pay Now
            </AppButton>
          </Box>
        </AppCard>
      </AppContainer>
    </Box>
  );
};

export default ListingPayment;
