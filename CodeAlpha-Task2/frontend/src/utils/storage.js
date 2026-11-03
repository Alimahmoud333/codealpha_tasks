/* localStorage can throw (private mode, blocked cookies), so every access is guarded. */

export function getStorageItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore: the user simply won't stay logged in after a refresh */
  }
}

export function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
