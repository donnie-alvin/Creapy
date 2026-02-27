import { Navigate } from "react-router-dom";

const ProtectedRoutes = (props: any) => {
  const authBlobRaw = localStorage.getItem("user");
  if (!authBlobRaw) {
    return <Navigate to="/login" />;
  }

  const allowedRoles: string[] | undefined = props.allowedRoles;
  if (!allowedRoles || allowedRoles.length === 0) {
    return props.children;
  }

  try {
    const authBlob = JSON.parse(authBlobRaw);
    const role = authBlob?.data?.user?.role;

    if (allowedRoles.includes(role)) {
      return props.children;
    }
  } catch (error) {
    console.error("Protected route parse error:", error);
  }

  return <Navigate to="/" />;
};

export default ProtectedRoutes;
