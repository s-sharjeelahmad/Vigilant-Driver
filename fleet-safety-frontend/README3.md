# README3 - Admin Integration and QA Guide

## Project

Vigilant Driver Monitoring and Safety Assurance System

## Environment Setup

Create a `.env` file in this folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000

# Frontend uses /api and Vite proxies to this backend URL.
```

## Run

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open app:

- http://localhost:5173

## Backend Endpoints Used (Admin)

- `POST /auth/admin/login`
- `GET /admin/dashboard`
- `GET /admin/companies`

All requests are executed using native `fetch`.
Requests are sent to `/api/...` on the frontend and proxied to backend.

## Security Constraint Confirmation

- No axios package has been added.
- No axios API is used in source code.

## QA Usage Notes

### Admin login and redirect

1. Open `/login`.
2. Keep role on `Admin`.
3. Enter:

- Admin UUID in Admin ID (UUID) field.
- Password in password field.

4. Submit.
5. On success user is redirected to `/admin/dashboard`.

### Protected route check

1. Clear session storage in browser.
2. Open `/admin/dashboard` directly.
3. App should redirect back to `/login`.

### Dashboard data and states

- While loading, loading message is shown.
- On API error, error message is shown.
- If certain backend fields are missing/null, placeholders and safe defaults are rendered.

## Changelog (Frontend)

### Modified files

- `index.html`
- `package.json`
- `README.md`
- `src/App.jsx`
- `src/styles.css`
- `src/components/Navbar.jsx`
- `src/components/Footer.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/AboutPage.jsx`
- `src/pages/ContactPage.jsx`
- `src/pages/LoginPage.jsx`

### New files

- `src/components/ProtectedAdminRoute.jsx`
- `src/pages/AdminDashboardPage.jsx`
- `README3.md`

## Notes

- Public pages (Home, About, Contact) remain available.
- Company login UI remains available and unchanged in backend behavior (no frontend API integration added for company).
