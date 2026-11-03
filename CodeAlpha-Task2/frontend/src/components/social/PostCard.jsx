import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios.js";
import { MAX_POST_LENGTH } from "../../constants/appConfig.js";
import { postPath, profilePath } from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import useToast from "../../hooks/useToast.js";
import postService from "../../services/postService.js";
import { formatDateTime, formatRelativeTime } from "../../utils/format.js";
import { resolveImageUrl } from "../../utils/images.js";
import Button from "../common/Button.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import Avatar from "./Avatar.jsx";
import InlineTextEditor from "./InlineTextEditor.jsx";

function PostEditor({ post, onCancel, onSaved }) {
  const [removeImage, setRemoveImage] = useState(false);

  return (
    <InlineTextEditor
      initial={post.content}
      maxLength={MAX_POST_LENGTH}
      label="Edit your post"
      onCancel={onCancel}
      onSave={async (text) => onSaved(await postService.update(post.id, { content: text, removeImage }))}
    >
      {post.imageUrl && (
        <label className="checkbox">
          <input type="checkbox" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)} />
          Remove the attached image
        </label>
      )}
    </InlineTextEditor>
  );
}

/*
 * One post. The parent owns the data: this component calls onUpdated(newPost)
 * or onDeleted(id) after the server has confirmed a change.
 * Edit = author only. Delete = author or administrator (the API enforces both).
 */
export default function PostCard({ post, onUpdated, onDeleted }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);

  const isAuthor = user.id === post.author.id;
  const canDelete = isAuthor || isAdmin;
  const edited = post.updatedAt !== post.createdAt;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    // Update the heart immediately, then replace it with the server's real numbers.
    const wasLiked = post.likedByMe;
    onUpdated({ ...post, likedByMe: !wasLiked, likeCount: post.likeCount + (wasLiked ? -1 : 1) });

    try {
      const state = wasLiked ? await postService.unlike(post.id) : await postService.like(post.id);
      onUpdated({ ...post, ...state });
    } catch (error) {
      onUpdated(post);
      toast.error(getApiErrorMessage(error, "Could not update your like."));
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postService.remove(post.id);
      toast.success("The post was deleted.");
      onDeleted(post.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The post could not be deleted."));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <article className="post">
      <header className="post__header">
        <Link to={profilePath(post.author.id)} className="post__author">
          <Avatar user={post.author} />
          <span className="post__author-text">
            <strong>{post.author.name}</strong>
            <span className="muted">@{post.author.username}</span>
          </span>
        </Link>
        <Link to={postPath(post.id)} className="post__time muted">
          <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
            {formatRelativeTime(post.createdAt)}
          </time>
          {edited && " · edited"}
        </Link>
      </header>

      {editing ? (
        <PostEditor
          post={post}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setEditing(false);
            onUpdated(updated);
            toast.success("Your post was updated.");
          }}
        />
      ) : (
        <>
          <p className="post__content">{post.content}</p>
          {post.imageUrl && <img className="post__image" src={resolveImageUrl(post.imageUrl)} alt={`Image shared by ${post.author.name}`} loading="lazy" />}
        </>
      )}

      <footer className="post__actions">
        <button type="button" className={`post-action${post.likedByMe ? " post-action--active" : ""}`} aria-pressed={post.likedByMe} onClick={handleLike}>
          <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} aria-hidden="true" />
          <span className="visually-hidden">Like, </span>
          {post.likeCount}
        </button>
        <Link to={postPath(post.id)} className="post-action">
          <MessageCircle size={18} aria-hidden="true" />
          <span className="visually-hidden">Comments, </span>
          {post.commentCount}
        </Link>

        {!editing && (isAuthor || canDelete) && (
          <div className="post__owner-actions">
            {isAuthor && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit<span className="visually-hidden"> post</span>
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
                Delete<span className="visually-hidden"> post</span>
              </Button>
            )}
          </div>
        )}
      </footer>

      {confirmingDelete && (
        <ConfirmDialog title="Delete this post?" confirmLabel="Delete post" busy={deleting} onConfirm={handleDelete} onClose={() => setConfirmingDelete(false)}>
          <p>This also removes its comments and likes. It can't be undone.</p>
        </ConfirmDialog>
      )}
    </article>
  );
}
