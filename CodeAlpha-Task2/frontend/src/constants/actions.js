/* Action names and initial states for the useReducer-based contexts. */

export const AUTH_ACTIONS = {
  RESTORE_SUCCESS: "auth/restoreSuccess",
  RESTORE_FAILURE: "auth/restoreFailure",
  REQUEST_START: "auth/requestStart",
  REQUEST_FAILURE: "auth/requestFailure",
  AUTH_SUCCESS: "auth/success",
  LOGOUT: "auth/logout",
  UPDATE_USER: "auth/updateUser",
};

export const INITIAL_AUTH_STATE = {
  initialized: false, // false until we know whether a saved token is still valid
  submitting: false, // true while a login/register request is running
  user: null,
};

export const CART_ACTIONS = {
  FETCH_START: "cart/fetchStart",
  SET_CART: "cart/set",
  FETCH_FAILURE: "cart/fetchFailure",
  RESET: "cart/reset",
};

export const INITIAL_CART_STATE = {
  items: [],
  itemCount: 0,
  total: 0,
  hasStockIssues: false,
  loading: false,
  initialized: false,
  error: null,
};

export const TOAST_ACTIONS = {
  ADD: "toast/add",
  REMOVE: "toast/remove",
};
