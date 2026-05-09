import { Navigate, useLocation } from "react-router-dom";
import { isAdminAuthenticated } from "../lib/adminSession";

function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const token = isAdminAuthenticated();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedAdminRoute;
