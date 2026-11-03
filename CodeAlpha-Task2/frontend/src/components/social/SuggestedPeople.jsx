import { Link } from "react-router-dom";
import APP_ROUTES from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import userService from "../../services/userService.js";
import UserListItem from "./UserListItem.jsx";

/* Small "who to follow" box shown next to the feed. If it can't load, it simply stays out of the way. */
export default function SuggestedPeople() {
  const { data } = useApiData(() => userService.search({ limit: 5 }), []);

  if (!data || data.items.length === 0) return null;

  return (
    <section className="sidebar-box" aria-labelledby="suggested-title">
      <h2 id="suggested-title" className="sidebar-box__title">
        People to follow
      </h2>
      <ul className="people-list people-list--compact">
        {data.items.map((person) => (
          <UserListItem key={person.id} person={person} />
        ))}
      </ul>
      <Link to={APP_ROUTES.PEOPLE}>Find more people</Link>
    </section>
  );
}
