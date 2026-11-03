import Button from "../common/Button.jsx";
import EmptyState from "../common/EmptyState.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import Spinner from "../common/Spinner.jsx";
import PostCard from "./PostCard.jsx";

/* Renders a useCursorList feed: loading, error, empty, the posts, and "Load more". */
export default function PostFeed({ feed, emptyTitle, emptyText, emptyAction }) {
  const { items, loading, loadingMore, error, nextCursor, reload, loadMore, replaceItem, removeItem } = feed;

  if (loading && items.length === 0) return <Spinner label="Loading posts…" />;
  if (error && items.length === 0) return <ErrorMessage title="Posts could not be loaded" message={error} onRetry={reload} />;

  if (items.length === 0) {
    return (
      <EmptyState title={emptyTitle} action={emptyAction}>
        {emptyText}
      </EmptyState>
    );
  }

  return (
    <>
      <ul className="post-list">
        {items.map((post) => (
          <li key={post.id}>
            <PostCard post={post} onUpdated={replaceItem} onDeleted={removeItem} />
          </li>
        ))}
      </ul>

      {error && <ErrorMessage title="More posts could not be loaded" message={error} onRetry={loadMore} />}

      {nextCursor && (
        <div className="load-more">
          <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
            Load more posts
          </Button>
        </div>
      )}
    </>
  );
}
