import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import ProductCard from "../../components/store/ProductCard.jsx";
import useApiData from "../../hooks/useApiData.js";
import useDebounce from "../../hooks/useDebounce.js";
import productService from "../../services/productService.js";
import { pluralize } from "../../utils/format.js";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
];

const PAGE_SIZE = 12;

export default function ProductsPage() {
  // Filters live in the URL, so a filtered view can be shared, bookmarked and used with the Back button.
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Number(params.get("page")) || 1;

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 400);

  const updateParams = (changes, options) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value === "" || value == null) next.delete(key);
        else next.set(key, value);
      }
      return next;
    }, options);

  // Typing updates the URL only after a short pause.
  useEffect(() => {
    if (debouncedSearch.trim() !== search) {
      updateParams({ q: debouncedSearch.trim(), page: "" }, { replace: true });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useApiData(() => productService.categories(), []);

  const products = useApiData(
    () =>
      productService.list({
        search: search || undefined,
        category: category || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    [search, category, sort, page],
  );

  const hasFilters = Boolean(search || category);

  const clearFilters = () => {
    setSearchText("");
    setParams({});
  };

  return (
    <div className="container page">
      <header className="page__header">
        <h1 className="page__title">Shop</h1>
        <p className="page__lead">Leather goods, watches and everyday accessories, made to last.</p>
      </header>

      <div className="shop">
        <aside className="shop__filters" aria-label="Filter products">
          <div className="field">
            <label htmlFor="product-search" className="field__label">
              Search
            </label>
            <input
              id="product-search"
              type="search"
              className="field__control"
              placeholder="Name or description"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="shop__categories">
            <h2 className="shop__filter-title">Category</h2>
            <ul>
              <li>
                <button type="button" className="filter-option" aria-pressed={!category} onClick={() => updateParams({ category: "", page: "" })}>
                  All products
                </button>
              </li>
              {(categories.data ?? []).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="filter-option"
                    aria-pressed={category === String(item.id)}
                    onClick={() => updateParams({ category: String(item.id), page: "" })}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            {categories.error && <p className="field__error">Categories could not be loaded.</p>}
          </div>
        </aside>

        <section className="shop__results" aria-label="Products">
          <div className="shop__toolbar">
            <p className="shop__count" aria-live="polite">
              {products.data ? `${products.data.meta.total} ${pluralize(products.data.meta.total, "product")}` : "\u00a0"}
            </p>
            <div className="field field--inline">
              <label htmlFor="product-sort" className="field__label">
                Sort by
              </label>
              <select id="product-sort" className="field__control" value={sort} onChange={(event) => updateParams({ sort: event.target.value === "newest" ? "" : event.target.value, page: "" })}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {products.error && !products.data && <ErrorMessage title="Products could not be loaded" message={products.error} onRetry={products.reload} />}

          {products.loading && !products.data && (
            <div className="product-grid" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="product-card product-card--skeleton" />
              ))}
            </div>
          )}

          {products.data && products.data.items.length === 0 && (
            <EmptyState
              title="No products found"
              action={
                hasFilters && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )
              }
            >
              {hasFilters ? "Try a different search or category." : "The catalog is empty right now."}
            </EmptyState>
          )}

          {products.data && products.data.items.length > 0 && (
            <>
              <div className={`product-grid${products.loading ? " product-grid--loading" : ""}`} aria-busy={products.loading}>
                {products.data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={products.data.meta.page} totalPages={products.data.meta.totalPages} onChange={(next) => updateParams({ page: next === 1 ? "" : String(next) })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
