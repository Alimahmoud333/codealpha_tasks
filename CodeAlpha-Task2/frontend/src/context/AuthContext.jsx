import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { AUTH_EXPIRED_EVENT } from "../api/axios.js";
import { AUTH_ACTIONS, INITIAL_AUTH_STATE } from "../constants/actions.js";
import STORAGE_KEYS from "../constants/storageKeys.js";
import authReducer from "../reducers/authReducer.js";
import authService from "../services/authService.js";
import { getStorageItem, removeStorageItem, setStorageItem } from "../utils/storage.js";

export const AuthContext = createContext(null);

/*
 * Token strategy: the JWT is kept in localStorage so a refresh keeps you logged in.
 * Trade-off: any XSS bug could read it (an httpOnly cookie can't be read by scripts,
 * but needs CSRF protection). React escapes output by default, and the API sets
 * security headers, which keeps this approach reasonable for this project.
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);

  // On first load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getStorageItem(STORAGE_KEYS.AUTH_TOKEN)) {
        dispatch({ type: AUTH_ACTIONS.RESTORE_FAILURE });
        return;
      }

      try {
        const user = await authService.me();
        if (!cancelled) dispatch({ type: AUTH_ACTIONS.RESTORE_SUCCESS, payload: user });
      } catch (error) {
        // A 401 already cleared the token. For other failures (server down) just stay logged out.
        if (error.response?.status === 401) removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!cancelled) dispatch({ type: AUTH_ACTIONS.RESTORE_FAILURE });
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // The API client announces expired tokens; we respond by logging out.
  useEffect(() => {
    const handleExpired = () => dispatch({ type: AUTH_ACTIONS.LOGOUT });
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const authenticate = useCallback(async (request) => {
    dispatch({ type: AUTH_ACTIONS.REQUEST_START });

    try {
      const { user, token } = await request();
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, token);
      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: user });
      return user;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.REQUEST_FAILURE });
      throw error; // the form decides how to show it
    }
  }, []);

  const login = useCallback((credentials) => authenticate(() => authService.login(credentials)), [authenticate]);
  const register = useCallback((details) => authenticate(() => authService.register(details)), [authenticate]);

  const logout = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  // Used after the profile is edited, so the navbar and posts show the new name/photo at once.
  const updateUser = useCallback((user) => dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: user }), []);

  const value = useMemo(
    () => ({
      user: state.user,
      initialized: state.initialized,
      submitting: state.submitting,
      authenticated: Boolean(state.user),
      isAdmin: state.user?.role === "admin",
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
