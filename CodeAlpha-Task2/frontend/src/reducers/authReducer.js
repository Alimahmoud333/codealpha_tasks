import { AUTH_ACTIONS } from "../constants/actions.js";

export default function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_SUCCESS:
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return { ...state, initialized: true, submitting: false, user: action.payload };

    case AUTH_ACTIONS.RESTORE_FAILURE:
    case AUTH_ACTIONS.LOGOUT:
      return { ...state, initialized: true, submitting: false, user: null };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: action.payload };

    case AUTH_ACTIONS.REQUEST_START:
      return { ...state, submitting: true };

    case AUTH_ACTIONS.REQUEST_FAILURE:
      return { ...state, submitting: false };

    default:
      return state;
  }
}
