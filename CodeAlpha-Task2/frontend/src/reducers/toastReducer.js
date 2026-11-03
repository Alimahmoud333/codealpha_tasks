import { TOAST_ACTIONS } from "../constants/actions.js";

export default function toastReducer(state, action) {
  switch (action.type) {
    case TOAST_ACTIONS.ADD:
      // Keep at most 4 messages on screen.
      return [...state, action.payload].slice(-4);

    case TOAST_ACTIONS.REMOVE:
      return state.filter((toast) => toast.id !== action.payload);

    default:
      return state;
  }
}
