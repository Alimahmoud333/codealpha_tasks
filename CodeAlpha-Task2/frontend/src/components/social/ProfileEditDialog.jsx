import { useEffect, useState } from "react";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import { MAX_BIO_LENGTH } from "../../constants/appConfig.js";
import userService from "../../services/userService.js";
import { validateImageFile } from "../../utils/validation.js";
import Button from "../common/Button.jsx";
import Dialog from "../common/Dialog.jsx";
import { TextAreaField, TextField } from "../common/Field.jsx";
import Avatar from "./Avatar.jsx";

/* Edit my profile: display name, bio and photo. Username and email can't be changed here. */
export default function ProfileEditDialog({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!avatar) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const handleFile = (event) => {
    const file = event.target.files?.[0] ?? null;
    const problem = file ? validateImageFile(file) : "";

    setErrors((current) => ({ ...current, avatar: problem || undefined }));
    if (problem) {
      event.target.value = "";
      return;
    }
    setAvatar(file);
    if (file) setRemoveAvatar(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters.";
    if (bio.trim().length > MAX_BIO_LENGTH) nextErrors.bio = `Bio can be at most ${MAX_BIO_LENGTH} characters.`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = new FormData();
    body.append("name", name.trim());
    body.append("bio", bio.trim());
    body.append("removeAvatar", String(removeAvatar));
    if (avatar) body.append("avatar", avatar);

    setSaving(true);
    try {
      onSaved(await userService.updateMe(body));
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getApiErrorMessage(error, "Your profile could not be saved."));
      setSaving(false);
    }
  };

  const showCurrentAvatar = !removeAvatar && !preview;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit profile"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="error-box" role="alert">
            {formError}
          </p>
        )}

        <div className="image-input">
          <div className="image-input__preview">
            {preview ? <img className="avatar avatar--lg" src={preview} alt="Selected profile photo" /> : <Avatar user={showCurrentAvatar ? user : { ...user, avatarUrl: null }} size="lg" />}
          </div>
          <TextField label="Profile photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} error={errors.avatar} hint="JPEG, PNG or WebP, up to 2 MB." />
        </div>

        {user.avatarUrl && !avatar && (
          <label className="checkbox">
            <input type="checkbox" checked={removeAvatar} onChange={(event) => setRemoveAvatar(event.target.checked)} />
            Remove my current photo
          </label>
        )}

        <TextField label="Display name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
        <TextAreaField label="Bio" rows={3} value={bio} onChange={(event) => setBio(event.target.value)} error={errors.bio} hint={`${bio.trim().length}/${MAX_BIO_LENGTH}`} />
      </form>
    </Dialog>
  );
}
