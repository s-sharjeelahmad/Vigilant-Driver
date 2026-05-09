import { getAdminToken } from "./adminSession";
import { getCompanyToken } from "./companySession";

const configuredBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = (
  import.meta.env.DEV
    ? "/api"
    : (configuredBase || "/api")
).replace(/\/$/, "");

async function parseResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.detail) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  const {
    authRole = "none",
    skipAuth = false,
    body,
    headers: providedHeaders,
    method = "GET",
    ...fetchOptions
  } = options;

  const token = authRole === "admin" ? getAdminToken() : authRole === "company" ? getCompanyToken() : null;
  const hasBody = body !== undefined;
  const useAuth = !skipAuth;

  const headers = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(providedHeaders || {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    ...fetchOptions,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined
  });

  return parseResponse(response);
}

export const adminApi = {
  login: (payload) => apiFetch("/auth/admin/login", { method: "POST", body: payload, skipAuth: true }),
  forgotPassword: (payload) => apiFetch("/auth/admin/forgot-password", { method: "POST", body: payload, skipAuth: true }),
  getDashboard: () => apiFetch("/admin/dashboard", { authRole: "admin" }),
  getCompanies: (search = "") => apiFetch(`/admin/companies${search ? `?search=${encodeURIComponent(search)}` : ""}`, { authRole: "admin" }),
  addCompany: (payload) => apiFetch("/admin/addcompanies", { method: "POST", body: payload, authRole: "admin" }),
  deleteCompany: (companyId) => apiFetch(`/admin/company/delete${companyId}`, { method: "DELETE", authRole: "admin" }),
  getProfile: () => apiFetch("/admin/me", { authRole: "admin" }),
  updateProfile: (payload) => apiFetch("/admin/me", { method: "PATCH", body: payload, authRole: "admin" })
};

export const companyApi = {
  login: (payload) => apiFetch("/auth/company/login", { method: "POST", body: payload, skipAuth: true }),
  forgotPassword: (payload) => apiFetch("/auth/company/forgot-password", { method: "POST", body: payload, skipAuth: true }),
  getProfile: () => apiFetch("/company/me", { authRole: "company" }),
  getDashboard: () => apiFetch("/company/dashboard", { authRole: "company" }),
  getDrivers: (search = "") => apiFetch(`/company/drivers${search ? `?search=${encodeURIComponent(search)}` : ""}`, { authRole: "company" }),
  addDriver: (payload) => apiFetch("/company/adddrivers", { method: "POST", body: payload, authRole: "company" }),
  updateDriver: (driverId, payload) => apiFetch(`/company/drivers/${driverId}`, { method: "PUT", body: payload, authRole: "company" }),
  deleteDriver: (driverId) => apiFetch(`/company/drivers/${driverId}`, { method: "DELETE", authRole: "company" }),
  getVehicles: () => apiFetch("/company/vehicles", { authRole: "company" }),
  addVehicle: (payload) => apiFetch("/company/addvehicles", { method: "POST", body: payload, authRole: "company" }),
  deleteVehicle: (vehicleId) => apiFetch(`/company/vehicles/${vehicleId}`, { method: "DELETE", authRole: "company" }),
  assignVehicle: (payload) => apiFetch("/company/assign-vehicle", { method: "POST", body: payload, authRole: "company" }),
  getSessions: () => apiFetch("/company/driver_sessions", { authRole: "company" }),
  getRecentSessions: () => apiFetch("/company/driver_recent_sessions", { authRole: "company" }),
  getActiveSessions: () => apiFetch("/company/driver_active_sessions", { authRole: "company" }),
  getAlerts: ({ status = "unread", since } = {}) => {
    const params = new URLSearchParams();
    params.set("status", status);
    if (since) {
      params.set("since", since);
    }
    return apiFetch(`/company/alerts?${params.toString()}`, { authRole: "company" });
  },
  ackAlert: (alertId) => apiFetch(`/company/alerts/${alertId}/ack`, { method: "PATCH", authRole: "company" }),
  getSessionEvents: (sessionId, limit = 100) =>
    apiFetch(`/company/sessions/${sessionId}/events?limit=${encodeURIComponent(limit)}`, { authRole: "company" }),
  updateProfile: (payload) => apiFetch("/company/me", { method: "PATCH", body: payload, authRole: "company" })
};

// AI Advisor
companyApi.chatAdvisor = (payload) => apiFetch("/company/ai-advisor/chat", { method: "POST", body: payload, authRole: "company" });
