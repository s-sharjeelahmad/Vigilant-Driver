import { Navigate, useLocation } from "react-router-dom";
import { isCompanyAuthenticated } from "../lib/companySession";

function ProtectedCompanyRoute({ children }) {
  const location = useLocation();

  if (!isCompanyAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedCompanyRoute;
