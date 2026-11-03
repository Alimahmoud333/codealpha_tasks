import { useState } from "react";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import Button from "../common/Button.jsx";
import { TextAreaField } from "../common/Field.jsx";

/*
 * Small "edit in place" form used for posts and comments.
 * onSave(text) does the API call; if it throws, the server's message is shown here.
 */
export default function InlineTextEditor({ initial, maxLength, label, onSave, onCancel, children }) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed) return setError("This can't be empty.");
    if (trimmed.length > maxLength) return setError(`Please use at most ${maxLength} characters.`);

    setSaving(true);
    setError("");
    try {
      await onSave(trimmed);
    } catch (saveError) {
      setError(getFieldErrors(saveError).content || getApiErrorMessage(saveError, "Your changes could not be saved."));
      setSaving(false);
    }
  };

  return (
    <form className="inline-editor" onSubmit={handleSubmit} noValidate>
      <TextAreaField
        label={label}
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        error={error}
        hint={`${text.trim().length}/${maxLength}`}
        autoFocus
      />
      {children}
      <div className="inline-editor__actions">
        <Button type="submit" loading={saving}>
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
