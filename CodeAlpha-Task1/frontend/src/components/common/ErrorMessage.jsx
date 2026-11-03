import Button from "./Button.jsx";

/* Inline error with an optional "Try again" button. role="alert" makes screen readers announce it. */
export default function ErrorMessage({ message, onRetry, title = "Something went wrong" }) {
  return (
    <div className="error-box" role="alert">
      <p className="error-box__title">{title}</p>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
