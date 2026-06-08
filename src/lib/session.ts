const SESSION_COOKIE = 'qchat_session';
const SESSION_EVENT = 'qchat-session-changed';

export const getSessionToken = () => {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
};

export const saveSessionToken = (sessionToken: string) => {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; path=/; max-age=2592000; SameSite=Lax`;
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const clearSessionToken = () => {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(SESSION_EVENT));
};

export const onSessionTokenChange = (listener: () => void) => {
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
};
