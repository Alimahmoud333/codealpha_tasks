import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import { MAX_POST_LENGTH } from "../../constants/appConfig.js";
import useAuth from "../../hooks/useAuth.js";
import useToast from "../../hooks/useToast.js";
import postService from "../../services/postService.js";
import { validateImageFile } from "../../utils/validation.js";
import Button from "../common/Button.jsx";
import Avatar from "./Avatar.jsx";

/* "What's on your mind?" box with an optional image. onCreated(post) receives the post the server saved. */
export default function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const textId = useId();
  const fileId = useId();

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileKey, setFileKey] = useState(0); // changing the key empties the file input
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const clearImage = () => {
    setImage(null);
    setFileKey((key) => key + 1);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      clearImage();
      return;
    }
    setError("");
    setImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = content.trim();

    if (!text) return setError("Write something first.");
    if (text.length > MAX_POST_LENGTH) return setError(`Posts can be at most ${MAX_POST_LENGTH} characters.`);

    const body = new FormData();
    body.append("content", text);
    if (image) body.append("image", image);

    setPosting(true);
    setError("");
    try {
      const post = await postService.create(body);
      setContent("");
      clearImage();
      toast.success("Your post is live.");
      onCreated(post);
    } catch (postError) {
      setError(getFieldErrors(postError).content || getFieldErrors(postError).image || getApiErrorMessage(postError, "Your post could not be published."));
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate aria-label="Write a post">
      <Avatar user={user} />
      <div className="composer__main">
        <label htmlFor={textId} className="visually-hidden">
          Write a post
        </label>
        <textarea
          id={textId}
          className="field__control"
          rows={3}
          placeholder="Share something with the community"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textId}-error` : undefined}
        />
        {error && (
          <p className="field__error" id={`${textId}-error`} role="alert">
            {error}
          </p>
        )}
        {preview && (
          <div className="composer__preview">
            <img src={preview} alt="Selected attachment" />
            <button type="button" className="composer__remove" onClick={clearImage} aria-label="Remove image">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="composer__footer">
          <div>
            <input key={fileKey} id={fileId} className="visually-hidden composer__file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
            <label htmlFor={fileId} className="btn btn--ghost composer__attach">
              <ImagePlus size={18} aria-hidden="true" />
              Add image
            </label>
          </div>
          <span className="muted composer__count" aria-live="off">
            {content.trim().length}/{MAX_POST_LENGTH}
          </span>
          <Button type="submit" loading={posting}>
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
