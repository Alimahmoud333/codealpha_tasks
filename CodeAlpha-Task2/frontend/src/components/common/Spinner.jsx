export default function Spinner({ label = "Loading…", fullPage = false }) {
  return (
    <div className={`spinner-wrap${fullPage ? " spinner-wrap--page" : ""}`} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
