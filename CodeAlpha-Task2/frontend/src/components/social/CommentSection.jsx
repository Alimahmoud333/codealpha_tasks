import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import { MAX_COMMENT_LENGTH } from "../../constants/appConfig.js";
import { profilePath } from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import useCursorList from "../../hooks/useCursorList.js";
import useToast from "../../hooks/useToast.js";
import postService from "../../services/postService.js";
import { formatDateTime, formatRelativeTime } from "../../utils/format.js";
import Button from "../common/Button.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import Spinner from "../common/Spinner.jsx";
import Avatar from "./Avatar.jsx";
import InlineTextEditor from "./InlineTextEditor.jsx";

function CommentForm({ onSubmit }) {
  const { user } = useAuth();
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed) return setError("Write a comment first.");
    if (trimmed.length > MAX_COMMENT_LENGTH) return setError(`Comments can be at most ${MAX_COMMENT_LENGTH} characters.`);

    setSending(true);
    setError("");
    try {
      await onSubmit(trimmed);
      setText("");
    } catch (submitError) {
      setError(getFieldErrors(submitError).content || getApiErrorMessage(submitError, "Your comment could not be posted."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} noValidate>
      <Avatar user={user} size="sm" />
      <div className="comment-form__main">
        <label htmlFor={id} className="visually-hidden">
          Add a comment
        </label>
        <textarea id={id} className="field__control" rows={2} placeholder="Add a comment" value={text} onChange={(event) => setText(event.target.value)} aria-invalid={Boolean(error)} />
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="comment-form__footer">
          <span className="muted">
            {text.trim().length}/{MAX_COMMENT_LENGTH}
          </span>
          <Button type="submit" loading={sending}>
            Comment
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({ comment, onChanged, onDeleted }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user.id === comment.author.id;
  const edited = comment.updatedAt !== comment.createdAt;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { commentCount } = await postService.removeComment(comment.id);
      toast.success("The comment was deleted.");
      onDeleted(comment.id, commentCount);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The comment could not be deleted."));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <li className="comment">
      <Avatar user={comment.author} size="sm" />
      <div className="comment__body">
        <p className="comment__meta">
          <Link to={profilePath(comment.author.id)}>
            <strong>{comment.author.name}</strong>
          </Link>{" "}
          <span className="muted">
            @{comment.author.username} ·{" "}
            <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
              {formatRelativeTime(comment.createdAt)}
            </time>
            {edited && " · edited"}
          </span>
        </p>

        {editing ? (
          <InlineTextEditor
            initial={comment.content}
            maxLength={MAX_COMMENT_LENGTH}
            label="Edit your comment"
            onCancel={() => setEditing(false)}
            onSave={async (text) => {
              onChanged(await postService.updateComment(comment.id, text));
              setEditing(false);
            }}
          />
        ) : (
          <p className="comment__content">{comment.content}</p>
        )}

        {!editing && (isAuthor || isAdmin) && (
          <div className="comment__actions">
            {isAuthor && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit<span className="visually-hidden"> comment</span>
              </Button>
            )}
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Delete<span className="visually-hidden"> comment</span>
            </Button>
          </div>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog title="Delete this comment?" confirmLabel="Delete comment" busy={deleting} onConfirm={handleDelete} onClose={() => setConfirmingDelete(false)}>
          <p>This can't be undone.</p>
        </ConfirmDialog>
      )}
    </li>
  );
}

/* Comments of one post. onCountChange(n) tells the page the post's real comment count after each change. */
export default function CommentSection({ postId, onCountChange }) {
  const list = useCursorList((cursor) => postService.listComments(postId, { cursor, limit: 20 }), [postId]);

  const handleCreate = async (text) => {
    const { comment, commentCount } = await postService.createComment(postId, text);

    // Older comments still waiting to load? Start over so the order stays correct.
    if (list.nextCursor) list.reload();
    else list.addItem(comment, "end");

    onCountChange(commentCount);
  };

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="section-title">
        Comments
      </h2>

      <CommentForm onSubmit={handleCreate} />

      {list.loading && list.items.length === 0 && <Spinner label="Loading comments…" />}
      {list.error && list.items.length === 0 && <ErrorMessage title="Comments could not be loaded" message={list.error} onRetry={list.reload} />}
      {!list.loading && !list.error && list.items.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}

      {list.items.length > 0 && (
        <ul className="comment-list">
          {list.items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onChanged={list.replaceItem}
              onDeleted={(id, commentCount) => {
                list.removeItem(id);
                onCountChange(commentCount);
              }}
            />
          ))}
        </ul>
      )}

      {list.error && list.items.length > 0 && <ErrorMessage title="More comments could not be loaded" message={list.error} onRetry={list.loadMore} />}

      {list.nextCursor && (
        <div className="load-more">
          <Button variant="secondary" loading={list.loadingMore} onClick={list.loadMore}>
            Load more comments
          </Button>
        </div>
      )}
    </section>
  );
}
