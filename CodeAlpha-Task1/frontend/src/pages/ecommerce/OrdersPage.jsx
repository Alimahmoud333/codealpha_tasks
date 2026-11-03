import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import APP_ROUTES, { orderPath } from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import orderService from "../../services/orderService.js";
import { formatDate, formatPrice } from "../../utils/format.js";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApiData(() => orderService.list({ page, limit: 10 }), [page]);

  return (
    <div className="container page">
      <h1 className="page__title">My orders</h1>

      {loading && !data && <Spinner label="Loading your orders…" />}
      {error && !data && <ErrorMessage title="Your orders could not be loaded" message={error} onRetry={reload} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title="No orders yet"
          action={
            <Link to={APP_ROUTES.SHOP} className="btn btn--primary">
              Start shopping
            </Link>
          }
        >
          When you place an order, it will show up here.
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table table--stack">
              <caption className="visually-hidden">Your orders, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Items</th>
                  <th scope="col" className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link to={orderPath(order.id)}>Order #{order.id}</Link>
                    </td>
                    <td data-label="Placed">{formatDate(order.createdAt)}</td>
                    <td data-label="Status">
                      <StatusBadge status={order.status} />
                    </td>
                    <td data-label="Items" className="num">{order.itemCount}</td>
                    <td data-label="Total" className="num">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
