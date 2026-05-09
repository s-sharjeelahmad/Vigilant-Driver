# Company Frontend Integration Guide

This document covers Company-side integration for Vigilant Driver Monitoring and Safety Assurance System.

## Execution Instructions

1. Open terminal in `fleet-safety-frontend`.
2. Install dependencies:
   - `npm install`
3. Create or update `.env` in `fleet-safety-frontend` with:
   - `VITE_API_BASE_URL=/api`
   - `VITE_BACKEND_URL=http://127.0.0.1:8000`
4. Start frontend:
   - `npm run dev`
5. Start backend (from backend project root where your app runs):
   - `uvicorn backened_code_final.authentication.main_1:app --reload`
6. Open the frontend URL shown by Vite and login as Company using UUID + password.

## Company Auth Contract

- Login endpoint: `POST /auth/company/login`
- Request payload:
  - `company_id: UUID`
  - `password: string`
- Response payload:
  - `access_token: string`
  - `token_type: string`
- Auth for protected Company endpoints:
  - `Authorization: Bearer <token>`

## Backend-to-Frontend Mapping

| Backend Endpoint                        | Method | Auth           | Request Fields                   | Response Fields (Main)                                                            | Frontend Usage                       |
| --------------------------------------- | ------ | -------------- | -------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| `/auth/company/login`                   | POST   | None           | `company_id`, `password`         | `access_token`, `token_type`                                                      | `src/pages/LoginPage.jsx`            |
| `/company/me`                           | GET    | Company Bearer | None                             | company profile fields (`company_id`, `company_name`, `email`, optional metadata) | `src/pages/CompanyProfilePage.jsx`   |
| `/company/dashboard`                    | GET    | Company Bearer | None                             | metrics fields (`total_sessions`, `total_events`, `risk_score`, etc.)             | `src/pages/CompanyDashboardPage.jsx` |
| `/company/drivers`                      | GET    | Company Bearer | optional `search` query          | list of company drivers                                                           | `src/pages/CompanyDriversPage.jsx`   |
| `/company/adddrivers`                   | POST   | Company Bearer | `CompanyDriverCreate` payload    | created driver record                                                             | `src/pages/CompanyDriversPage.jsx`   |
| `/company/drivers/{driver_id}`          | PUT    | Company Bearer | `CompanyDriverUpdate` payload    | updated driver record                                                             | `src/pages/CompanyDriversPage.jsx`   |
| `/company/drivers/{driver_id}`          | DELETE | Company Bearer | path `driver_id`                 | delete confirmation                                                               | `src/pages/CompanyDriversPage.jsx`   |
| `/company/vehicles`                     | GET    | Company Bearer | None                             | list of company vehicles                                                          | `src/pages/CompanyVehiclesPage.jsx`  |
| `/company/addvehicles`                  | POST   | Company Bearer | `VehicleCreateCompany` payload   | created vehicle record                                                            | `src/pages/CompanyVehiclesPage.jsx`  |
| `/company/assign-vehicle`               | POST   | Company Bearer | `driver_id`, `vehicle_id`        | assignment confirmation                                                           | `src/pages/CompanyVehiclesPage.jsx`  |
| `/company/vehicles/{vehicle_id}`        | DELETE | Company Bearer | path `vehicle_id`                | delete confirmation                                                               | `src/pages/CompanyVehiclesPage.jsx`  |
| `/company/driver_sessions`              | GET    | Company Bearer | None                             | all company sessions                                                              | `src/pages/CompanySessionsPage.jsx`  |
| `/company/driver_recent_sessions`       | GET    | Company Bearer | None                             | recent sessions                                                                   | `src/pages/CompanySessionsPage.jsx`  |
| `/company/driver_active_sessions`       | GET    | Company Bearer | None                             | active sessions                                                                   | `src/pages/CompanySessionsPage.jsx`  |
| `/company/sessions/{session_id}/events` | GET    | Company Bearer | path `session_id`, query `limit` | list of session events                                                            | `src/pages/CompanySessionsPage.jsx`  |
| `/company/alerts`                       | GET    | Company Bearer | query `status`, optional `since` | list of alerts                                                                    | `src/pages/CompanyAlertsPage.jsx`    |
| `/company/alerts/{alert_id}/ack`        | PATCH  | Company Bearer | path `alert_id`                  | ack response                                                                      | `src/pages/CompanyAlertsPage.jsx`    |

## Frontend Structure Added for Company

- Route guard: `src/components/ProtectedCompanyRoute.jsx`
- Company navigation: `src/components/CompanySubnav.jsx`
- Session storage utility: `src/lib/companySession.js`
- Central API utility methods: `src/lib/apiClient.js`
- Company pages:
  - `src/pages/CompanyDashboardPage.jsx`
  - `src/pages/CompanyProfilePage.jsx`
  - `src/pages/CompanyDriversPage.jsx`
  - `src/pages/CompanyVehiclesPage.jsx`
  - `src/pages/CompanySessionsPage.jsx`
  - `src/pages/CompanyAlertsPage.jsx`

## UX and Cleanup Notes

- Company login is UUID + password only.
- User-visible coding placeholders/debug labels were removed from Company-side outputs.
- Missing values are rendered as `N/A` or `No data available`.
- All API calls use native `fetch` via central utility.
- No axios dependency is used.

## Manual Verification Checklist

1. Login with valid Company UUID + password redirects to `/company/dashboard`.
2. Invalid Company login shows backend error message.
3. Dashboard metrics load; missing values show as `N/A`.
4. Profile page loads `/company/me` fields.
5. Drivers page loads list and supports search.
6. Drivers create works with required fields.
7. Drivers update works on selected row.
8. Drivers delete removes entry.
9. Vehicles page lists vehicles and allows creating vehicles.
10. Vehicle assignment to driver succeeds.
11. Vehicle delete works and list refreshes.
12. Sessions page switches all/recent/active and loads corresponding data.
13. Events load for selected session with configurable limit.
14. Alerts page filters by status/since and lists alerts.
15. Acknowledge action updates unread alert state.
16. Visiting `/company/*` without token redirects to `/login`.
17. Admin pages and login still function unchanged.

## Important Notes

- Backend currently returns password in `CompanyResponse` for `/company/me`. Frontend intentionally does not display password.
- Backend may return `404` with messages like `No drivers found.` or `No vehicles found.` for empty collections; frontend treats those as empty states where applicable.
