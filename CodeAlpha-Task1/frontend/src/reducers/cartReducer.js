import { CART_ACTIONS, INITIAL_CART_STATE } from "../constants/actions.js";

export default function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };

    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items,
        itemCount: action.payload.itemCount,
        total: action.payload.total,
        hasStockIssues: action.payload.hasStockIssues,
        loading: false,
        initialized: true,
        error: null,
      };

    case CART_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, initialized: true, error: action.payload };

    case CART_ACTIONS.RESET:
      return INITIAL_CART_STATE;

    default:
      return state;
  }
}
