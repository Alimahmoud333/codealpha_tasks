/* Screen-reader friendly notifications: polite live region, each message can be dismissed. */
export default function Toaster({ toasts, onDismiss }) {
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
