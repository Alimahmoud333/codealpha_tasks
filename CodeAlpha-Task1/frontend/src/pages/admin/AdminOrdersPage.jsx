import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from "../../constants/orderConstants.js";
import { orderPath } from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import useToast from "../../hooks/useToast.js";
import orderService from "../../services/orderService.js";
import { formatDate, formatPrice } from "../../utils/format.js";

/* One row's "change status" control: only the moves allowed from the current status are offered. */
function StatusControl({ order, busy, onChange }) {
  const [next, setNext] = useState("");
  const allowed = ORDER_TRANSITIONS[order.status] ?? [];

  if (allowed.length === 0) return <span className="muted">No further changes</span>;

  return (
    <div className="status-control">
      <label className="visually-hidden" htmlFor={`status-${order.id}`}>
        New status for order {order.id}
      </label>
      <select id={`status-${order.id}`} className="field__control" value={next} onChange={(event) => setNext(event.target.value)} disabled={busy}>
        <option value="">Change to…</option>
        {allowed.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        disabled={!next || busy}
        onClick={() => {
          onChange(order, next);
          setNext("");
        }}
      >
        Update
      </Button>
    </div>
  );
}

export default function AdminOrdersPage() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);

  const orders = useApiData(() => orderService.adminList({ status: status || undefined, page, limit: 10 }), [status, page]);

  const applyStatus = async (order, newStatus) => {
    setBusyId(order.id);
    try {
      await orderService.adminUpdateStatus(order.id, newStatus);
      toast.success(`Order #${order.id} is now ${ORDER_STATUS_LABELS[newStatus].toLowerCase()}.`);
      await orders.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The status could not be updated."));
      orders.reload();
    } finally {
      setBusyId(null);
      setPendingCancel(null);
    }
  };

  // Cancelling returns stock and can't be undone, so it asks first.
  const requestChange = (order, newStatus) => (newStatus === "cancelled" ? setPendingCancel(order) : applyStatus(order, newStatus));

  return (
    <section aria-labelledby="admin-orders-title">
      <div className="admin-toolbar">
        <h2 id="admin-orders-title" className="section-title">
          Orders
        </h2>
        <div className="field field--inline">
          <label htmlFor="order-status-filter" className="field__label">
            Status
          </label>
          <select
            id="order-status-filter"
            className="field__control"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orders.loading && !orders.data && <Spinner label="Loading orders…" />}
      {orders.error && !orders.data && <ErrorMessage message={orders.error} onRetry={orders.reload} />}
      {orders.data && orders.data.items.length === 0 && <EmptyState title="No orders found">{status ? "No orders have this status." : "Orders will appear here once customers check out."}</EmptyState>}

      {orders.data && orders.data.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table table--stack">
              <caption className="visually-hidden">All customer orders, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Placed</th>
                  <th scope="col" className="num">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Change status</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.items.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link to={orderPath(order.id)}>#{order.id}</Link>
                    </td>
                    <td data-label="Customer">
                      {order.customer?.name}
                      <br />
                      <span className="muted">{order.customer?.email}</span>
                    </td>
                    <td data-label="Placed">{formatDate(order.createdAt)}</td>
                    <td data-label="Total" className="num">{formatPrice(order.total)}</td>
                    <td data-label="Status">
                      <StatusBadge status={order.status} />
                    </td>
                    <td data-label="Change status">
                      <StatusControl order={order} busy={busyId === order.id} onChange={requestChange} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={orders.data.meta.page} totalPages={orders.data.meta.totalPages} onChange={setPage} />
        </>
      )}

      {pendingCancel && (
        <ConfirmDialog
          title={`Cancel order #${pendingCancel.id}?`}
          confirmLabel="Cancel order"
          busy={busyId === pendingCancel.id}
          onConfirm={() => applyStatus(pendingCancel, "cancelled")}
          onClose={() => setPendingCancel(null)}
        >
          <p>The ordered items will be returned to stock. A cancelled order cannot be reopened.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
