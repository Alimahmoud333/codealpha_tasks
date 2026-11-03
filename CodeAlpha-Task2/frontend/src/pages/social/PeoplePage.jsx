import { useState } from "react";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import UserListItem from "../../components/social/UserListItem.jsx";
import useApiData from "../../hooks/useApiData.js";
import useDebounce from "../../hooks/useDebounce.js";
import userService from "../../services/userService.js";

export default function PeoplePage() {
  const [searchText, setSearchText] = useState("");
  const query = useDebounce(searchText.trim(), 400);
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApiData(() => userService.search({ q: query || undefined, page, limit: 12 }), [query, page]);

  return (
    <section aria-labelledby="people-title">
      <div className="admin-toolbar">
        <h2 id="people-title" className="section-title">
          {query ? "Search results" : "People you may want to follow"}
        </h2>
        <div className="field field--inline">
          <label htmlFor="people-search" className="field__label">
            Search people
          </label>
          <input
            id="people-search"
            type="search"
            className="field__control"
            placeholder="Name or username"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading && !data && <Spinner label="Loading people…" />}
      {error && !data && <ErrorMessage title="People could not be loaded" message={error} onRetry={reload} />}

      {data && data.items.length === 0 && (
        <EmptyState title={query ? "Nobody matches that search" : "You're following everyone"}>
          {query ? "Check the spelling or try a different name." : "New people will appear here as they join."}
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className="people-list" aria-busy={loading}>
            {data.items.map((person) => (
              <UserListItem key={person.id} person={person} />
            ))}
          </ul>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}
