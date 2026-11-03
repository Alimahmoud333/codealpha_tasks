import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import CommentSection from "../../components/social/CommentSection.jsx";
import PostCard from "../../components/social/PostCard.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import postService from "../../services/postService.js";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, loading, error, reload, setData } = useApiData(() => postService.get(id), [id]);

  if (loading && !post) return <Spinner label="Loading post…" />;

  if (error && !post) {
    return (
      <>
        <ErrorMessage title="This post could not be loaded" message={error} onRetry={reload} />
        <p>
          <Link to={APP_ROUTES.COMMUNITY}>Back to the feed</Link>
        </p>
      </>
    );
  }

  return (
    <div className="community__single">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to={APP_ROUTES.COMMUNITY}>Feed</Link>
      </nav>

      <PostCard post={post} onUpdated={setData} onDeleted={() => navigate(APP_ROUTES.COMMUNITY, { replace: true })} />

      <CommentSection postId={post.id} onCountChange={(commentCount) => setData((current) => ({ ...current, commentCount }))} />
    </div>
  );
}
