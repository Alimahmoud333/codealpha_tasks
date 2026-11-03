import { Link, useSearchParams } from "react-router-dom";
import PostComposer from "../../components/social/PostComposer.jsx";
import PostFeed from "../../components/social/PostFeed.jsx";
import SuggestedPeople from "../../components/social/SuggestedPeople.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useCursorList from "../../hooks/useCursorList.js";
import postService from "../../services/postService.js";

export default function FeedPage() {
  const [params, setParams] = useSearchParams();
  const scope = params.get("scope") === "following" ? "following" : "all";

  const feed = useCursorList((cursor) => postService.list({ scope, cursor, limit: 10 }), [scope]);

  const chooseScope = (next) => setParams(next === "all" ? {} : { scope: next });

  return (
    <div className="community">
      <div className="community__main">
        {/* A new post appears at the top of either feed (the "following" feed includes your own posts). */}
        <PostComposer onCreated={(post) => feed.addItem(post)} />

        <div className="segmented" role="group" aria-label="Choose which posts to show">
          <button type="button" aria-pressed={scope === "all"} onClick={() => chooseScope("all")}>
            Everyone
          </button>
          <button type="button" aria-pressed={scope === "following"} onClick={() => chooseScope("following")}>
            Following
          </button>
        </div>

        <PostFeed
          feed={feed}
          emptyTitle={scope === "following" ? "Nothing here yet" : "No posts yet"}
          emptyText={scope === "following" ? "Follow a few people and their posts will show up here." : "Be the first to share something."}
          emptyAction={
            scope === "following" && (
              <Link to={APP_ROUTES.PEOPLE} className="btn btn--primary">
                Find people to follow
              </Link>
            )
          }
        />
      </div>

      <aside className="community__side" aria-label="Suggestions">
        <SuggestedPeople />
      </aside>
    </div>
  );
}
