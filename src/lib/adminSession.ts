const ADMIN_SESSION_COOKIE = 'qchat_admin_session';
const ADMIN_SESSION_EVENT = 'qchat-admin-session-changed';

export const getAdminSessionToken = () => {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
};

export const saveAdminSessionToken = (sessionToken: string) => {
  document.cookie = `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; path=/; max-age=28800; SameSite=Lax`;
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
};

export const clearAdminSessionToken = () => {
  document.cookie = `${ADMIN_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
};

export const onAdminSessionTokenChange = (listener: () => void) => {
  window.addEventListener(ADMIN_SESSION_EVENT, listener);
  return () => window.removeEventListener(ADMIN_SESSION_EVENT, listener);
};
