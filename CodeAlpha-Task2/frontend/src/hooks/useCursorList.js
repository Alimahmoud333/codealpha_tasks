import { useCallback, useEffect, useReducer, useRef } from "react";
import { getApiErrorMessage } from "../api/axios.js";

const INITIAL = { items: [], nextCursor: null, loading: true, loadingMore: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return INITIAL;
    case "loaded":
      return { items: action.items, nextCursor: action.nextCursor, loading: false, loadingMore: false, error: null };
    case "moreStart":
      return { ...state, loadingMore: true, error: null };
    case "moreLoaded": {
      const known = new Set(state.items.map((item) => item.id));
      const fresh = action.items.filter((item) => !known.has(item.id));
      return { ...state, items: [...state.items, ...fresh], nextCursor: action.nextCursor, loadingMore: false };
    }
    case "failure":
      return { ...state, loading: false, loadingMore: false, error: action.error };
    case "add": {
      const withoutDuplicate = state.items.filter((item) => item.id !== action.item.id);
      return { ...state, items: action.where === "end" ? [...withoutDuplicate, action.item] : [action.item, ...withoutDuplicate] };
    }
    case "replace":
      return { ...state, items: state.items.map((item) => (item.id === action.item.id ? action.item : item)) };
    case "remove":
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    default:
      return state;
  }
}

/*
 * A list that loads a first page, then more pages on demand ("Load more").
 * `fetchPage(cursor)` must return { items, meta: { nextCursor } }.
 * The list starts over whenever `deps` change (e.g. another tab or user).
 * Used for the post feed and for comments.
 */
export default function useCursorList(fetchPage, deps) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const latestRequest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    dispatch({ type: "reset" });

    try {
      const { items, meta } = await fetchPage(undefined);
      if (requestId === latestRequest.current) dispatch({ type: "loaded", items, nextCursor: meta.nextCursor });
    } catch (error) {
      if (requestId === latestRequest.current) dispatch({ type: "failure", error: getApiErrorMessage(error) });
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.loadingMore) return;

    const requestId = latestRequest.current;
    dispatch({ type: "moreStart" });

    try {
      const { items, meta } = await fetchPage(state.nextCursor);
      if (requestId === latestRequest.current) dispatch({ type: "moreLoaded", items, nextCursor: meta.nextCursor });
    } catch (error) {
      if (requestId === latestRequest.current) dispatch({ type: "failure", error: getApiErrorMessage(error) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, state.nextCursor, state.loadingMore]);

  const addItem = useCallback((item, where = "start") => dispatch({ type: "add", item, where }), []);
  const replaceItem = useCallback((item) => dispatch({ type: "replace", item }), []);
  const removeItem = useCallback((id) => dispatch({ type: "remove", id }), []);

  return { ...state, reload: load, loadMore, addItem, replaceItem, removeItem };
}
