# Admin Frontend Integration Guide

This document describes admin-only frontend integration for Vigilant Driver Monitoring and Safety Assurance System.

## Run Instructions

1. Open terminal in `fleet-safety-frontend`.
2. Install dependencies:
   - `npm install`
3. Set environment variable in `.env`:
   - `VITE_BACKEND_URL=http://127.0.0.1:8000`
4. Start frontend:
   - `npm run dev`
5. Ensure FastAPI backend is running on the same URL.

Development note:

- Browser requests use `/api` in dev and are proxied by Vite to `VITE_BACKEND_URL`.
- Optional production base override can still be set with `VITE_API_BASE_URL`.

## Admin Endpoint Mapping

| Backend Endpoint                    | Method | Frontend Page/Flow           | File                               |
| ----------------------------------- | ------ | ---------------------------- | ---------------------------------- |
| `/auth/admin/login`                 | POST   | Admin login submit           | `src/pages/LoginPage.jsx`          |
| `/admin/dashboard`                  | GET    | Dashboard metrics cards      | `src/pages/AdminDashboardPage.jsx` |
| `/admin/companies`                  | GET    | Companies list + search      | `src/pages/AdminCompaniesPage.jsx` |
| `/admin/addcompanies`               | POST   | Add company form             | `src/pages/AdminCompaniesPage.jsx` |
| `/admin/company/delete{company_id}` | DELETE | Delete company action        | `src/pages/AdminCompaniesPage.jsx` |
| `/admin/me`                         | GET    | Admin profile read-only view | `src/pages/AdminProfilePage.jsx`   |

## Shared API/Session Layers

- API utility: `src/lib/apiClient.js`
- Session utility: `src/lib/adminSession.js`
- Protected route guard: `src/components/ProtectedAdminRoute.jsx`

## Manual Test Checklist

1. Admin login succeeds with valid `admin_id` + `password`.
2. Invalid admin login shows backend error detail.
3. Admin dashboard loads totals and risk status without placeholder text.
4. Admin profile page shows `/admin/me` data.
5. Companies page shows list from `/admin/companies`.
6. Search filters company list through backend query.
7. Add company creates a new record and refreshes list.
8. Delete company removes record and refreshes list.
9. Logout clears session and redirects to `/login`.
10. Directly opening `/admin/*` without token redirects to login.

## Notes

- Native `fetch` is used for all HTTP calls.
- No axios dependency is used.
- Company/public pages were not modified in behavior for this admin integration update.
