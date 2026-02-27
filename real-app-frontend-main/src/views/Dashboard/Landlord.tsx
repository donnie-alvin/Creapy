// React Imports
import { useNavigate } from "react-router-dom";
// MUI Imports
import { Box } from "@mui/material";
// Component Imports
import AllListings from "../Listing/components/allListings";
import AppContainer from "../../components/ui/AppContainer";

const LandlordDashboard = () => {
  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <AllListings />
      </AppContainer>
    </Box>
  );
};

export default LandlordDashboard;
