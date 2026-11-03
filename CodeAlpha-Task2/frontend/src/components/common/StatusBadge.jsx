import { ORDER_STATUS_LABELS } from "../../constants/orderConstants.js";

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}
