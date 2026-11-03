import { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getApiErrorMessage } from "../api/axios.js";
import { CART_ACTIONS, INITIAL_CART_STATE } from "../constants/actions.js";
import useAuth from "../hooks/useAuth.js";
import cartReducer from "../reducers/cartReducer.js";
import cartService from "../services/cartService.js";

export const CartContext = createContext(null);

/*
 * The cart lives in MySQL (one cart per user), so this context is only a copy
 * of what the server returned. Every change calls the API first and then stores
 * the cart the server sends back: the backend stays the source of truth.
 */
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_CART_STATE);
  const { user } = useAuth();
  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    dispatch({ type: CART_ACTIONS.FETCH_START });

    try {
      const cart = await cartService.get();
      if (requestId === latestRequest.current) dispatch({ type: CART_ACTIONS.SET_CART, payload: cart });
    } catch (error) {
      if (requestId === latestRequest.current) {
        dispatch({ type: CART_ACTIONS.FETCH_FAILURE, payload: getApiErrorMessage(error, "Could not load your cart.") });
      }
    }
  }, []);

  // Load the cart when someone logs in, empty it when they log out.
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      latestRequest.current++; // ignore any response still on its way
      dispatch({ type: CART_ACTIONS.RESET });
    }
  }, [user?.id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCart = useCallback((cart) => {
    latestRequest.current++;
    dispatch({ type: CART_ACTIONS.SET_CART, payload: cart });
    return cart;
  }, []);

  // These throw on failure so the calling page can show the server's message.
  const addItem = useCallback(async (productId, quantity) => applyCart(await cartService.addItem(productId, quantity)), [applyCart]);
  const updateItem = useCallback(async (itemId, quantity) => applyCart(await cartService.updateItem(itemId, quantity)), [applyCart]);
  const removeItem = useCallback(async (itemId) => applyCart(await cartService.removeItem(itemId)), [applyCart]);

  const value = useMemo(
    () => ({ ...state, refresh, addItem, updateItem, removeItem }),
    [state, refresh, addItem, updateItem, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
