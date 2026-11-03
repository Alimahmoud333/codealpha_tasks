import { Link } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import { formatDate } from "../../utils/format.js";

export default function AccountPage() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="container page page--narrow">
      <h1 className="page__title">Your account</h1>

      <dl className="details details--account">
        <div>
          <dt>Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt>Username</dt>
          <dd>@{user.username}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Account type</dt>
          <dd>{isAdmin ? "Administrator" : "Customer"}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
      </dl>

      <div className="button-row">
        <Link to={APP_ROUTES.ORDERS} className="btn btn--primary">
          View my orders
        </Link>
        {isAdmin && (
          <Link to={APP_ROUTES.ADMIN_PRODUCTS} className="btn btn--secondary">
            Manage store
          </Link>
        )}
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
