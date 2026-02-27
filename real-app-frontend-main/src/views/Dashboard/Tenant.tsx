// React Imports
import { useNavigate } from "react-router-dom";
// MUI Imports
import { Box } from "@mui/material";
// Component Imports
import { Heading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";

const TenantDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <Box sx={{ textAlign: "center" }}>
          <Heading>Tenant Dashboard</Heading>
          <Box sx={{ marginTop: "20px", color: "#334155" }}>
            Welcome to your tenant dashboard. Manage your saved searches and favorite listings here.
          </Box>
        </Box>
      </AppContainer>
    </Box>
  );
};

export default TenantDashboard;
