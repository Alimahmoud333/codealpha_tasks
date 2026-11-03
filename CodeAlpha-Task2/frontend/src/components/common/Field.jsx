import { useId } from "react";

/*
 * Labelled form controls. Each one wires up the label, the hint and the error
 * message for screen readers (aria-invalid + aria-describedby).
 */

function FieldShell({ label, error, hint, id, children }) {
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export function TextField({ label, error, hint, ...inputProps }) {
  const id = useId();

  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <input id={id} className="field__control" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...inputProps} />
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, ...textareaProps }) {
  const id = useId();

  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <textarea id={id} className="field__control" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...textareaProps} />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, children, ...selectProps }) {
  const id = useId();

  return (
    <FieldShell label={label} error={error} hint={hint} id={id}>
      <select id={id} className="field__control" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...selectProps}>
        {children}
      </select>
    </FieldShell>
  );
}
