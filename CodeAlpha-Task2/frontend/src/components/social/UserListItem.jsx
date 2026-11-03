import { Link } from "react-router-dom";
import { profilePath } from "../../constants/appRoutes.js";
import Avatar from "./Avatar.jsx";
import FollowButton from "./FollowButton.jsx";

/* One person in a list (people search, followers, following). */
export default function UserListItem({ person }) {
  return (
    <li className="person">
      <Link to={profilePath(person.id)} className="person__link">
        <Avatar user={person} />
        <span className="person__text">
          <strong>{person.name}</strong>
          <span className="muted">@{person.username}</span>
          {person.bio && <span className="person__bio">{person.bio}</span>}
        </span>
      </Link>
      {!person.isSelf && <FollowButton userId={person.id} name={person.name} initialFollowing={person.isFollowing} />}
    </li>
  );
}
