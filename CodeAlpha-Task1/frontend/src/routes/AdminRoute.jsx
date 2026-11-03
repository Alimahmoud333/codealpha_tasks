import { Navigate, Outlet } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
import APP_ROUTES from "../constants/appRoutes.js";
import useAuth from "../hooks/useAuth.js";

/*
 * Hides admin pages from everyone else. This is a convenience only:
 * the real protection is on the server, which rejects non-admins with 403.
 */
export default function AdminRoute() {
  const { initialized, authenticated, isAdmin } = useAuth();

  if (!initialized) return <Spinner label="Checking your session…" fullPage />;
  if (!authenticated) return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: APP_ROUTES.ADMIN_PRODUCTS }} />;
  if (!isAdmin) return <Navigate to={APP_ROUTES.SHOP} replace />;

  return <Outlet />;
}
