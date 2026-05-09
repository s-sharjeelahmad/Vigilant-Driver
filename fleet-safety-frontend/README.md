# Vigilant Driver Monitoring and Safety Assurance System (Frontend)

A responsive frontend for the Vigilant Driver Monitoring and Safety Assurance System with Home, About Us, Contact Us, Login, and Admin Dashboard pages.

## Run Locally

1. Open terminal in this folder.
2. Install dependencies:

   npm install

3. Set environment variable in `.env`:

   VITE_API_BASE_URL=http://127.0.0.1:8000

   Note: frontend calls use `/api/...` and Vite proxies them to `VITE_API_BASE_URL`.

4. Start development server:

   npm run dev

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Build

npm run build

## Reusable UI Components

- Navbar
- Footer
- SectionHeader
- FeatureCard
- RiskPill

## Notes

- Admin login and admin dashboard use native `fetch` through Vite proxy (`/api`).
- Company login remains UI-only.
- Fully responsive for desktop and mobile.
