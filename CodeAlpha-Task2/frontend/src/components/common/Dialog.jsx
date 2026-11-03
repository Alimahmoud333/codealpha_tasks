import { useEffect, useId, useRef } from "react";

/*
 * Modal dialog built on the native <dialog> element. The browser handles the
 * focus trap, the Escape key and the backdrop, so it works with a keyboard
 * and screen readers without extra libraries.
 */
export default function Dialog({ open, onClose, title, children, footer, size = "md" }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleBackdropClick = (event) => {
    // Clicks on the dialog's own box (outside the content wrapper) count as backdrop clicks.
    if (event.target === ref.current) onClose();
  };

  return (
    <dialog ref={ref} className={`dialog dialog--${size}`} aria-labelledby={titleId} onClose={onClose} onClick={handleBackdropClick}>
      {open && (
        <div className="dialog__content">
          <h2 className="dialog__title" id={titleId}>
            {title}
          </h2>
          <div className="dialog__body">{children}</div>
          {footer && <div className="dialog__footer">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
