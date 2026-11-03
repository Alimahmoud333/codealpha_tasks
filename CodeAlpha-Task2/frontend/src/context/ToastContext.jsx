import { createContext, useCallback, useMemo, useReducer, useRef } from "react";
import Toaster from "../components/common/Toaster.jsx";
import { TOAST_ACTIONS } from "../constants/actions.js";
import toastReducer from "../reducers/toastReducer.js";

export const ToastContext = createContext(null);

const DURATION_MS = { success: 4000, info: 4000, error: 7000 };

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => dispatch({ type: TOAST_ACTIONS.REMOVE, payload: id }), []);

  const show = useCallback(
    (type, message) => {
      const id = nextId.current++;
      dispatch({ type: TOAST_ACTIONS.ADD, payload: { id, type, message } });
      setTimeout(() => dismiss(id), DURATION_MS[type]);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
