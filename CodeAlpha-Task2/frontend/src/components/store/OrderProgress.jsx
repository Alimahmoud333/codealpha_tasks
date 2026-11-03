import { ORDER_PROGRESS, ORDER_STATUS_LABELS } from "../../constants/orderConstants.js";

/* Simple step tracker. Cancelled orders show a notice instead of progress. */
export default function OrderProgress({ status }) {
  if (status === "cancelled") {
    return <p className="notice notice--danger">This order was cancelled. Items have been returned to stock.</p>;
  }

  const currentIndex = ORDER_PROGRESS.indexOf(status);

  return (
    <ol className="progress" aria-label="Order progress">
      {ORDER_PROGRESS.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";

        return (
          <li key={step} className={`progress__step progress__step--${state}`} aria-current={state === "current" ? "step" : undefined}>
            {ORDER_STATUS_LABELS[step]}
          </li>
        );
      })}
    </ol>
  );
}
