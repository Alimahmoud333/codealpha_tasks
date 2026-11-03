import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState.jsx";
import APP_ROUTES from "../constants/appRoutes.js";

export default function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState
        title="Page not found"
        action={
          <Link to={APP_ROUTES.SHOP} className="btn btn--primary">
            Go to the shop
          </Link>
        }
      >
        The page you are looking for doesn't exist or has moved.
      </EmptyState>
    </div>
  );
}
