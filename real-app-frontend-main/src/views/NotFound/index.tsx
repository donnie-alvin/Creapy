// React Imports
import { useNavigate } from "react-router-dom";
// React Icons
import { FaExclamationTriangle } from "react-icons/fa";
// MUI Imports
import { Box } from "@mui/material";
// Component Imports
import { SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: "75vh", display: "flex", alignItems: "center" }}>
      <AppContainer>
        <AppCard sx={{ maxWidth: 420, margin: "0 auto", p: 3, textAlign: "center" }}>
          <FaExclamationTriangle style={{ color: "#64748b", fontSize: "5em" }} />
          <h1>404</h1>
          <SubHeading sx={{ marginBottom: "30px" }}>
            Sorry, this page does not exist
          </SubHeading>
          <AppButton
            onClick={() => {
              navigate("/");
            }}
          >
            Go Back
          </AppButton>
        </AppCard>
      </AppContainer>
    </Box>
  );
};

export default NotFound;
