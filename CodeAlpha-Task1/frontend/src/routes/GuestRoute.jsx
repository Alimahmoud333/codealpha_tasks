import { Navigate, Outlet } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
import APP_ROUTES from "../constants/appRoutes.js";
import useAuth from "../hooks/useAuth.js";

/* Login/register pages: already logged-in users are redirected away. */
export default function GuestRoute() {
  const { initialized, authenticated } = useAuth();

  if (!initialized) return <Spinner label="Checking your session…" fullPage />;
  if (authenticated) return <Navigate to={APP_ROUTES.SHOP} replace />;

  return <Outlet />;
}
