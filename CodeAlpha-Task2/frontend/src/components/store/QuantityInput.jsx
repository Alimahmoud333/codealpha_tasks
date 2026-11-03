import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { MAX_QUANTITY } from "../../constants/appConfig.js";

/*
 * Quantity stepper. The visible text can be edited freely; when the field is
 * left (or Enter is pressed) the number is validated, clamped to min..max and
 * reported through onChange(number). Values above the stock are never emitted.
 */
export default function QuantityInput({ value, onChange, min = 1, max = MAX_QUANTITY, disabled = false, label = "Quantity" }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));

  // Keep the text in step when the real value changes (e.g. after the server answers).
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw) => {
    const parsed = Number(raw);

    if (raw === "" || !Number.isInteger(parsed)) {
      setDraft(String(value)); // not a whole number: go back to the last good value
      return;
    }

    const clamped = Math.min(Math.max(parsed, min), max);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div className="qty">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <button type="button" className="qty__button" aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => commit(value - 1)}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        id={id}
        className="qty__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
          }
        }}
      />
      <button type="button" className="qty__button" aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => commit(value + 1)}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
