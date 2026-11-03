import { Link, useParams } from "react-router-dom";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import OrderSummary from "../../components/store/OrderSummary.jsx";
import ShippingDetails from "../../components/store/ShippingDetails.jsx";
import APP_ROUTES, { orderPath } from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import orderService from "../../services/orderService.js";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { data: order, loading, error, reload } = useApiData(() => orderService.get(id), [id]);

  if (loading && !order) return <Spinner label="Loading your order…" fullPage />;

  if (error && !order) {
    return (
      <div className="container page">
        <ErrorMessage title="This order could not be loaded" message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="container page page--narrow">
      <header className="confirmation">
        <p className="confirmation__eyebrow">Order placed</p>
        <h1 className="page__title">Thank you, {order.shipping.fullName.split(" ")[0]}.</h1>
        <p className="page__lead">
          Your order <strong>#{order.id}</strong> is confirmed. You will pay on delivery. We'll update its status as it moves along.
        </p>
      </header>

      <section aria-labelledby="confirmation-items">
        <h2 id="confirmation-items" className="section-title">
          What you ordered
        </h2>
        <OrderSummary order={order} />
      </section>

      <section aria-labelledby="confirmation-shipping">
        <h2 id="confirmation-shipping" className="section-title">
          Delivery
        </h2>
        <ShippingDetails order={order} />
      </section>

      <div className="button-row">
        <Link to={orderPath(order.id)} className="btn btn--primary">
          View order
        </Link>
        <Link to={APP_ROUTES.SHOP} className="btn btn--secondary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
