import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./views/Home";
import NotFound from "./views/NotFound";
import Login from "./views/Login";
import SignUp from "./views/SignUp";
import Profile from "./views/Profile";
import About from "./views/About";
import Header from "./components/Header";
import PublicRoutes from "./routes/PublicRoutes";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import CreateListing from "./views/Listing";
import ViewListing from "./views/Listing/components/viewListing";
import SearchPage from "./views/Search";
import SavedSearches from "./views/SavedSearches";
import LandlordDashboard from "./views/Dashboard/Landlord";
import TenantDashboard from "./views/Dashboard/Tenant";
import ListingPayment from "./views/Dashboard/Payment";
import VerifyEmail from "./views/VerifyEmail";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/signup"
          element={
            <PublicRoutes>
              <SignUp />
            </PublicRoutes>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoutes>
              <Login />
            </PublicRoutes>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/listing/:id" element={<ViewListing />} />
        {/* Protected Routes */}
        <Route
          path="/saved-searches"
          element={
            <ProtectedRoutes>
              <SavedSearches />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoutes>
              <Profile />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard/landlord"
          element={
            <ProtectedRoutes allowedRoles={["landlord"]}>
              <LandlordDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard/tenant"
          element={
            <ProtectedRoutes allowedRoles={["tenant"]}>
              <TenantDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/create-listing"
          element={
            <ProtectedRoutes allowedRoles={["landlord"]}>
              <CreateListing />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/listings/:id/pay"
          element={
            <ProtectedRoutes allowedRoles={["landlord"]}>
              <ListingPayment />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/listings"
          element={
            <ProtectedRoutes allowedRoles={["landlord"]}>
              <Navigate to="/dashboard/landlord" replace />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/listings/:id"
          element={
            <ProtectedRoutes allowedRoles={["landlord"]}>
              <CreateListing />
            </ProtectedRoutes>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
