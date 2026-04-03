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
import ProviderDashboard from "./views/Dashboard/Provider";
import TenantDashboard from "./views/Dashboard/Tenant";
import ListingPayment from "./views/Dashboard/Payment";
import AdminDashboard from "./views/Dashboard/Admin";
import VerifyEmail from "./views/VerifyEmail";
import Stays from "./views/Stays";
import StayRoomDetail from "./views/Stays/RoomDetail";
import MyStayBookings from "./views/Stays/MyBookings";
import ProviderSignUp from "./views/ProviderSignUp";

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
        <Route
          path="/provider-signup"
          element={
            <PublicRoutes>
              <ProviderSignUp />
            </PublicRoutes>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/stays/rooms/:roomId" element={<StayRoomDetail />} />
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
          path="/stays/bookings"
          element={
            <ProtectedRoutes>
              <MyStayBookings />
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
          path="/dashboard/provider"
          element={
            <ProtectedRoutes allowedRoles={["provider"]}>
              <ProviderDashboard />
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
          path="/dashboard/admin"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <AdminDashboard />
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
