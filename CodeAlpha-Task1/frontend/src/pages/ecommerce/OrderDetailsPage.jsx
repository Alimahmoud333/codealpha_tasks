import { Link, useParams } from "react-router-dom";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import OrderProgress from "../../components/store/OrderProgress.jsx";
import OrderSummary from "../../components/store/OrderSummary.jsx";
import ShippingDetails from "../../components/store/ShippingDetails.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import useAuth from "../../hooks/useAuth.js";
import orderService from "../../services/orderService.js";
import { formatDateTime } from "../../utils/format.js";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data: order, loading, error, reload } = useApiData(() => orderService.get(id), [id]);

  if (loading && !order) return <Spinner label="Loading order…" fullPage />;

  if (error && !order) {
    return (
      <div className="container page">
        <ErrorMessage title="This order could not be loaded" message={error} onRetry={reload} />
        <p>
          <Link to={APP_ROUTES.ORDERS}>Back to my orders</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container page page--narrow">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to={isAdmin ? APP_ROUTES.ADMIN_ORDERS : APP_ROUTES.ORDERS}>{isAdmin ? "All orders" : "My orders"}</Link>
      </nav>

      <header className="order-header">
        <div>
          <h1 className="page__title">Order #{order.id}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <OrderProgress status={order.status} />

      {isAdmin && order.customer && (
        <p className="notice">
          Customer: {order.customer.name} ({order.customer.email})
        </p>
      )}

      <section aria-labelledby="order-items">
        <h2 id="order-items" className="section-title">
          Items
        </h2>
        <OrderSummary order={order} />
      </section>

      <section aria-labelledby="order-shipping">
        <h2 id="order-shipping" className="section-title">
          Delivery
        </h2>
        <ShippingDetails order={order} />
      </section>
    </div>
  );
}
