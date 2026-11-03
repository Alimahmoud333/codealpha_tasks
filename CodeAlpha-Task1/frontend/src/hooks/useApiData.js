import { useCallback, useEffect, useReducer, useRef } from "react";
import { getApiErrorMessage } from "../api/axios.js";

function reducer(state, action) {
  switch (action.type) {
    case "start":
      // Keep the previous data while reloading, so lists don't flash empty when filters change.
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.payload, loading: false, error: null };
    case "failure":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

/*
 * Loads data with `fetcher()` whenever `deps` change.
 *   const { data, loading, error, reload } = useApiData(() => productService.get(id), [id]);
 * A counter ignores answers from outdated requests (e.g. a slow search finishing late).
 */
export default function useApiData(fetcher, deps, { enabled = true } = {}) {
  const [state, dispatch] = useReducer(reducer, { data: null, loading: enabled, error: null });
  const latestRequest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    dispatch({ type: "start" });

    try {
      const result = await fetcher();
      if (requestId === latestRequest.current) dispatch({ type: "success", payload: result });
    } catch (error) {
      if (requestId === latestRequest.current) dispatch({ type: "failure", payload: getApiErrorMessage(error) });
    }
  }, deps);

  useEffect(() => {
    if (enabled) load();
  }, [load, enabled]);

  return { ...state, reload: load };
}
