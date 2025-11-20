# Project Requirements Document for `cafe-app-ai`

## 1. Project Overview

`cafe-app-ai` is a full-stack web application starter template built on Next.js and TypeScript. It solves the common problem of setting up a modern, production-ready web app from scratch by bundling user authentication, a protected dashboard, rich UI components, database integration, theming, and deployment configurations into one opinionated boilerplate. Developers can clone the repo and immediately begin building features instead of spending days wiring up auth flows, UI libraries, and database schemas.

The goal is to accelerate time-to-market and enforce best practices out of the box. Key objectives for this first version include:

- Secure, working sign-up and sign-in flows with session handling.
- A protected dashboard showcasing cards, tables, and charts.
- Accessible, themeable UI components via `shadcn/ui` and Tailwind CSS.
- Type-safe database access with Drizzle ORM and PostgreSQL.
- Dark mode support and deployment pipelines for Vercel and Docker.

Success will be measured by how quickly a new project can stand up, authenticate users, and display real data with minimal additional setup.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (First Version)

- Email/password sign-up and sign-in flows using the "Better Auth" service.
- Protected dashboard routes that redirect unauthenticated users to the login page.
- Pre-built UI components (buttons, forms, cards, tables, charts) from `shadcn/ui`, styled with Tailwind.
- PostgreSQL integration via Drizzle ORM, including user and session schemas.
- Automatic dark mode based on system preference, with a toggle switch.
- Docker and Docker Compose files for containerized dev and production.
- Vercel configuration for serverless deployment (Next.js standalone build).
- Basic inline error handling on forms.

### Out-of-Scope (Later Phases)

- Multi-role or permission systems beyond simple authenticated/unauthenticated states.
- Email/SMS notifications, password reset flows, or OAuth/social logins.
- CI/CD beyond Vercel (e.g., GitHub Actions pipelines).
- Extensive unit, integration, or end-to-end test suites.
- Analytics, reporting dashboards, or complex charting libraries.
- Mobile-first or native mobile apps; this repo focuses on web.
- Third-party payment or billing integrations.

## 3. User Flow

When an end user first visits the app, they land on the sign-in page (or are redirected there if they try to access `/dashboard`). They can click a link to register a new account. On the sign-up form, they provide an email and password. Once they submit, the frontend calls the Next.js API route (`/api/auth/[...all]`) which proxies the request to the Better Auth service. If registration succeeds, the user is automatically logged in and redirected to `/dashboard`.

On the dashboard, the layout shows a header with a site logo, a dark-mode toggle, and a user menu. A sidebar presents navigation links to different data views. The main content area renders cards, tables, and charts that fetch data from additional API routes or the database via Drizzle. Users remain authenticated until they sign out, at which point they are sent back to the login page.

## 4. Core Features

- **Authentication Module**: Sign-up, sign-in, session persistence, sign-out.
- **Protected Routes**: Dashboard and sub-pages only accessible with a valid session.
- **Dashboard Layout**: Responsive header, sidebar, main content area.
- **UI Component Library**: Buttons, inputs, modals, tooltips, cards, tables, charts from `shadcn/ui`.
- **Database Layer**: PostgreSQL schemas for `users` and `sessions`, Drizzle ORM setup.
- **Theming**: Light/dark mode support with CSS variables and Tailwind CSS.
- **Deployment Configuration**: Docker/Docker Compose for local and production, Vercel settings.
- **Error Handling**: Inline form validation and feedback.

## 5. Tech Stack & Tools

- **Frontend**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, CSS variables.
- **UI Library**: `shadcn/ui` (copied into `/components/ui`).
- **Icons**: Lucide React.
- **Backend & API**: Next.js API routes, Better Auth service for authentication.
- **Database**: PostgreSQL, Drizzle ORM for type-safe queries.
- **Deployment**: Vercel (serverless), Docker & Docker Compose for containerization.
- **Utilities**: `cn` helper for Tailwind class merging.

## 6. Non-Functional Requirements

- **Performance**: Initial page load under 200ms on moderate connections; dashboard interactions under 100ms.
- **Security**: HTTPS enforced, secure cookies (`HttpOnly`, `SameSite=Strict`), input validation/sanitization, CORS configured.
- **Accessibility**: Components adhere to WCAG AA standards; keyboard navigation and ARIA roles supported.
- **Scalability**: Support horizontal scaling via stateless Next.js serverless functions and Docker containers.
- **Maintainability**: TypeScript types across front and back ends; modular directory structure.

## 7. Constraints & Assumptions

- **Node Version**: v18+; Docker installed locally.
- **Auth Service**: Better Auth API credentials must be provided via environment variables.
- **Database**: A PostgreSQL instance reachable from local and production environments.
- **Build Output**: Assumes Vercel’s standalone Next.js build works out of the box.
- **Developer Tools**: VS Code or similar with TypeScript and Tailwind IntelliSense recommended.

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**: Better Auth service may throttle requests; implement retry or backoff logic if needed.
- **Drizzle Migrations**: Without a dedicated migration tool, schema changes require manual scripts.
- **Tailwind Purge**: Incorrect PurgeCSS settings could remove unused classes; ensure `content` paths cover all component files.
- **SSR Data Fetching**: Mixing server and client components can lead to hydration mismatches; follow Next.js guidelines carefully.
- **CORS/Env Leaks**: Misconfigured environment variables might expose secrets; validate `.env` usage and gitignore settings.

Quick mitigations:

- Add basic retry logic around auth calls.
- Adopt Drizzle Kit or a migration CLI in a future iteration.
- Double-check Tailwind config after adding new file paths.
- Use Next.js error boundaries and logging for SSR mismatches.
- Audit environment variable usage in both local and CI/CD configurations.

---

This document serves as the single source of truth for the AI and future technical documents. It ensures every feature, flow, tool, and constraint is crystal clear, leaving no room for guesswork in implementation or subsequent design guidelines.