export const COMPANY_TOKEN_KEY = "vdmsas_company_token";
export const COMPANY_SESSION_KEY = "vdmsas_company_session";

export function getCompanyToken() {
  return sessionStorage.getItem(COMPANY_TOKEN_KEY);
}

export function setCompanySession(accessToken, tokenType = "bearer", rememberMe = false) {
  sessionStorage.setItem(COMPANY_TOKEN_KEY, accessToken);
  sessionStorage.setItem(
    COMPANY_SESSION_KEY,
    JSON.stringify({ role: "company", tokenType, rememberMe })
  );
}

export function clearCompanySession() {
  sessionStorage.removeItem(COMPANY_TOKEN_KEY);
  sessionStorage.removeItem(COMPANY_SESSION_KEY);
}

export function isCompanyAuthenticated() {
  return Boolean(getCompanyToken());
}
