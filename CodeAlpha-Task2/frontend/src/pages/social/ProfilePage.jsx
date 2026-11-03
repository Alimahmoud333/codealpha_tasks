import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import Avatar from "../../components/social/Avatar.jsx";
import FollowButton from "../../components/social/FollowButton.jsx";
import PostFeed from "../../components/social/PostFeed.jsx";
import ProfileEditDialog from "../../components/social/ProfileEditDialog.jsx";
import UserListItem from "../../components/social/UserListItem.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import useAuth from "../../hooks/useAuth.js";
import useCursorList from "../../hooks/useCursorList.js";
import useToast from "../../hooks/useToast.js";
import postService from "../../services/postService.js";
import userService from "../../services/userService.js";
import { formatDate } from "../../utils/format.js";

const TABS = ["posts", "followers", "following"];

function ProfilePosts({ profile }) {
  const feed = useCursorList((cursor) => postService.list({ userId: profile.id, cursor, limit: 10 }), [profile.id]);

  return (
    <PostFeed
      feed={feed}
      emptyTitle="No posts yet"
      emptyText={profile.isSelf ? "Share your first post from the feed." : `${profile.name} hasn't posted anything yet.`}
      emptyAction={
        profile.isSelf && (
          <Link to={APP_ROUTES.COMMUNITY} className="btn btn--primary">
            Go to the feed
          </Link>
        )
      }
    />
  );
}

/* Followers or following list (kind = "followers" | "following"). */
function Connections({ userId, kind }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApiData(() => userService[kind](userId, { page, limit: 20 }), [userId, kind, page]);

  if (loading && !data) return <Spinner label="Loading…" />;
  if (error && !data) return <ErrorMessage message={error} onRetry={reload} />;

  if (data.items.length === 0) {
    return <EmptyState title={kind === "followers" ? "No followers yet" : "Not following anyone yet"} />;
  }

  return (
    <>
      <ul className="people-list" aria-busy={loading}>
        {data.items.map((person) => (
          <UserListItem key={person.id} person={person} />
        ))}
      </ul>
      <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
    </>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab = TABS.includes(requestedTab) ? requestedTab : "posts";

  const { updateUser } = useAuth();
  const toast = useToast();
  const { data: profile, loading, error, reload, setData } = useApiData(() => userService.get(id), [id]);
  const [editing, setEditing] = useState(false);

  if (loading && !profile) return <Spinner label="Loading profile…" />;

  if (error && !profile) {
    return (
      <>
        <ErrorMessage title="This profile could not be loaded" message={error} onRetry={reload} />
        <p>
          <Link to={APP_ROUTES.COMMUNITY}>Back to the feed</Link>
        </p>
      </>
    );
  }

  const stats = [
    { tab: "posts", label: "Posts", value: profile.stats.posts },
    { tab: "followers", label: "Followers", value: profile.stats.followers },
    { tab: "following", label: "Following", value: profile.stats.following },
  ];

  return (
    <div className="community__single">
      <header className="profile">
        <Avatar user={profile} size="xl" />
        <div className="profile__info">
          <h2 className="profile__name">{profile.name}</h2>
          <p className="muted">
            @{profile.username} · Joined {formatDate(profile.joinedAt)}
          </p>
          {profile.bio && <p className="profile__bio">{profile.bio}</p>}
        </div>
        <div className="profile__action">
          {profile.isSelf ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          ) : (
            <FollowButton
              userId={profile.id}
              name={profile.name}
              initialFollowing={profile.isFollowing}
              onChange={(result) => setData((current) => ({ ...current, isFollowing: result.following, stats: { ...current.stats, followers: result.followerCount } }))}
            />
          )}
        </div>
      </header>

      <nav className="profile__tabs" aria-label="Profile sections">
        {stats.map((item) => (
          <Link key={item.tab} to={{ search: item.tab === "posts" ? "" : `?tab=${item.tab}` }} aria-current={tab === item.tab ? "page" : undefined}>
            <strong>{item.value}</strong> {item.label}
          </Link>
        ))}
      </nav>

      {tab === "posts" ? <ProfilePosts key={profile.id} profile={profile} /> : <Connections key={`${profile.id}-${tab}`} userId={profile.id} kind={tab} />}

      {editing && (
        <ProfileEditDialog
          user={profile}
          onClose={() => setEditing(false)}
          onSaved={(user) => {
            updateUser(user); // navbar and your posts pick up the new name/photo
            setData((current) => ({ ...current, name: user.name, bio: user.bio, avatarUrl: user.avatarUrl }));
            setEditing(false);
            toast.success("Your profile was updated.");
          }}
        />
      )}
    </div>
  );
}
