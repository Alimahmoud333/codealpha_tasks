import { Navigate, Outlet, useLocation } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
import APP_ROUTES from "../constants/appRoutes.js";
import useAuth from "../hooks/useAuth.js";

/* Logged-in users only. Others are sent to the login page and brought back afterwards. */
export default function ProtectedRoute() {
  const { initialized, authenticated } = useAuth();
  const location = useLocation();

  if (!initialized) return <Spinner label="Checking your session…" fullPage />;

  if (!authenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
