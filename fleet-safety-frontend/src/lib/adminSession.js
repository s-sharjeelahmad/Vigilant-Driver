export const ADMIN_TOKEN_KEY = "vdmsas_admin_token";
export const ADMIN_SESSION_KEY = "vdmsas_admin_session";

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminSession(accessToken, tokenType = "bearer", rememberMe = false) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
  sessionStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({ role: "admin", tokenType, rememberMe })
  );
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}
