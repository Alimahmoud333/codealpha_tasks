import Button from "./Button.jsx";
import Dialog from "./Dialog.jsx";

/* A small "are you sure?" dialog for destructive actions (delete a product, cancel an order). */
export default function ConfirmDialog({ title, children, confirmLabel, busy = false, onConfirm, onClose }) {
  return (
    <Dialog
      open
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
