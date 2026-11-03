import { NavLink, Outlet } from "react-router-dom";
import APP_ROUTES from "../constants/appRoutes.js";

/* Wraps the admin pages with a small section menu. Access is enforced by <AdminRoute> and, above all, by the API. */
export default function AdminLayout() {
  return (
    <div className="container page">
      <h1 className="page__title">Manage store</h1>
      <nav className="subnav" aria-label="Store management">
        <NavLink to={APP_ROUTES.ADMIN_PRODUCTS}>Products</NavLink>
        <NavLink to={APP_ROUTES.ADMIN_ORDERS}>Orders</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
