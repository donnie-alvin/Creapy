import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useTypedSelector from "../hooks/useTypedSelector";
import { selectedUserRole } from "../redux/auth/authSlice";

interface ProtectedRoutesProps {
  allowedRoles?: string[];
  children: ReactNode;
}

const ProtectedRoutes = ({ allowedRoles, children }: ProtectedRoutesProps) => {
  const authUser = useTypedSelector((state) => state.auth?.user);
  const role = useTypedSelector(selectedUserRole);
  const destination =
    role === "admin"
      ? "/dashboard/admin"
      : role === "landlord"
        ? "/dashboard/landlord"
        : role === "provider"
          ? "/dashboard/provider"
        : role === "tenant"
          ? "/dashboard/tenant"
          : "/";

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <Navigate to={destination} replace />;
};

export default ProtectedRoutes;
