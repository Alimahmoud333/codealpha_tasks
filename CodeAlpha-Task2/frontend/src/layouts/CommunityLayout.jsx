import { NavLink, Outlet } from "react-router-dom";
import APP_ROUTES, { profilePath } from "../constants/appRoutes.js";
import useAuth from "../hooks/useAuth.js";

/* Shared frame for the community pages: title + section menu. Access is enforced by <ProtectedRoute>. */
export default function CommunityLayout() {
  const { user } = useAuth();

  return (
    <div className="container page">
      <h1 className="page__title">Community</h1>
      <nav className="subnav" aria-label="Community">
        <NavLink to={APP_ROUTES.COMMUNITY} end>
          Feed
        </NavLink>
        <NavLink to={APP_ROUTES.PEOPLE}>People</NavLink>
        <NavLink to={profilePath(user.id)}>My profile</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
