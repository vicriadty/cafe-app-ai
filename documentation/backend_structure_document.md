# Backend Structure Document

## Backend Architecture

The backend of the `cafe-app-ai` starter template follows a modern, modular design powered by Next.js and TypeScript. It focuses on clarity, scalability, and ease of maintenance.

**Key design patterns and frameworks:**

- **Next.js App Router & API Routes**: Uses built-in serverless functions to handle all server-side logic, routing, and data fetching.
- **Service Layer**: Authentication logic is abstracted into a dedicated service that interacts with the external "Better Auth" provider.
- **ORM Layer**: Database operations go through Drizzle ORM for type-safe, clear, and efficient SQL interactions.
- **Component Isolation**: UI components, utility functions, and database code live in separate folders (`components`, `lib`, `db`) to keep concerns separated.

How this design supports:

- **Scalability**: Serverless API routes can scale automatically with traffic. Modular services make it easy to add new features without impacting existing ones.
- **Maintainability**: Clear separation of responsibilities (routing, business logic, data access) reduces coupling and makes the codebase easier to navigate.
- **Performance**: Next.js’s server-side rendering (SSR) and incremental static regeneration (ISR) optimize page load times. Drizzle’s lightweight queries minimize database overhead.

## Database Management

The application relies on a PostgreSQL relational database, accessed through Drizzle ORM.

**Database technologies used:**

- Type: SQL (Relational)
- System: PostgreSQL
- ORM: Drizzle ORM (type-safe, lightweight)

**Data structure and access:**

- **Tables**: Stores user accounts and session tokens in well-defined tables.
- **Connections**: A single, pooled database connection is managed via Drizzle’s client initialization.
- **Data practices**:
  - Use of transactions for multi-step operations.
  - Parameterized queries to prevent SQL injection.
  - Timestamps on records for auditability (`created_at`, `updated_at`).

## Database Schema

Below is a human-readable overview of the main tables, followed by SQL definitions.

**Tables and fields:**

1. **Users**
   - **id**: Unique identifier (UUID)
   - **email**: User’s email (unique)
   - **hashed_password**: Securely hashed password
   - **created_at**: Account creation timestamp
   - **updated_at**: Last update timestamp

2. **Sessions**
   - **id**: Unique identifier (UUID)
   - **user_id**: References the Users table
   - **session_token**: Random token for session lookup
   - **expires_at**: Expiration timestamp for automatic sign-out
   - **created_at**: Session creation timestamp

**SQL Schema (PostgreSQL):**

```sql
-- Users table
drop table if exists users cascade;
create table users (
  id             uuid      default gen_random_uuid() primary key,
  email          text      not null unique,
  hashed_password text     not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

-- Sessions table
drop table if exists sessions;
create table sessions (
  id            uuid      default gen_random_uuid() primary key,
  user_id       uuid      not null references users(id) on delete cascade,
  session_token text      not null unique,
  expires_at    timestamptz not null,
  created_at    timestamptz default now() not null
);

-- Index to quickly find active sessions
create index idx_sessions_token on sessions(session_token);
``` 

## API Design and Endpoints

All server-side endpoints are implemented as Next.js API routes under `/api`.

**Approach:** RESTful principles, each route corresponds to a clear action. JSON is used for requests and responses.

**Key endpoints:**

- **POST /api/auth/signup**: Registers a new user.
  - Request: `{ email, password }`
  - Response: Success message or error details.

- **POST /api/auth/signin**: Authenticates a user.
  - Request: `{ email, password }`
  - Response: Session token and user info.

- **POST /api/auth/signout**: Logs out the user.
  - Request: `{ sessionToken }`
  - Response: Confirmation of sign-out.

- **GET /api/auth/session**: Retrieves current session details.
  - Request: Session cookie or token.
  - Response: `{ user, expiresAt }` or `null` if not authenticated.

- **(Optional) GET /api/dashboard/data**: Fetches protected data for the dashboard.
  - Requires valid session token.
  - Response: JSON payload with cards, table rows, chart metrics.

Each endpoint passes through a shared middleware that:

1. Validates the request body.
2. Checks or sets authentication via the Better Auth service.
3. Uses Drizzle ORM to read/write database records.
4. Returns structured JSON with `status`, `data`, and `error` fields.

## Hosting Solutions

The project is set up for two main environments:

- **Vercel (Production)**
  - Serverless functions power API routes.
  - Built-in global CDN accelerates static assets.
  - Automatic HTTPS and custom domain support.

- **Docker & Docker Compose (Local / Self-hosted)**
  - `Dockerfile` creates a container with Node.js and the Next.js app.
  - `docker-compose.yml` links the app container to a PostgreSQL container for local testing.

**Benefits:**

- **Reliability**: Vercel’s serverless platform handles high availability out of the box.
- **Scalability**: API routes scale horizontally with demand.
- **Cost-effectiveness**: Pay-as-you-go model on Vercel, free tier for small projects; Docker setup requires only a machine and PostgreSQL license.

## Infrastructure Components

Even though much is managed by Vercel, key components include:

- **Load Balancer**: Vercel’s edge network distributes requests globally.
- **Content Delivery Network (CDN)**: Static assets (JS, CSS, images) are cached at edge nodes for faster delivery.
- **Database Pooling**: Drizzle ORM uses a connection pool to optimize database performance.
- **Caching**: Next.js can cache server-side props or API responses for short periods to reduce load.
- **Environment Variables**: Managed securely via Vercel UI or `.env` files for local development.

These pieces work together to ensure that users experience fast load times and reliable interactions.

## Security Measures

**Authentication & Authorization:**

- Offloaded to the external **Better Auth** service for robust credential handling.
- Session tokens are stored in secure, HttpOnly cookies.
- Most routes are protected by a session-checking middleware.

**Data protection:**

- **Encryption in transit**: HTTPS enforced by Vercel.
- **Encryption at rest**: Provided by managed PostgreSQL (if using a cloud provider).
- **Password hashing**: Strong hashing algorithm (e.g., bcrypt or argon2) for user passwords.

**Additional practices:**

- Input validation on both client and server.
- Parameterized database queries to prevent SQL injection.
- CORS configured to allow only the frontend origin.
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=strict`.

## Monitoring and Maintenance

**Monitoring tools:**

- **Vercel dashboard**: Real-time logs, metrics on requests and errors.
- **Custom logging**: Console logs or third-party services (e.g., Sentry) for error tracking.
- **Database monitoring**: Tools like pgAdmin or cloud-provider dashboards for connection and query performance.

**Maintenance strategies:**

- **Automated migrations**: Use Drizzle Kit to version and apply schema changes.
- **Regular backups**: Schedule database dumps (daily or weekly).
- **Dependency updates**: Monitor for security patches in Next.js, Drizzle, and other packages.
- **Health checks**: Periodic testing of API routes and database connectivity.

## Conclusion and Overall Backend Summary

The `cafe-app-ai` backend is built on a solid foundation of Next.js, TypeScript, and PostgreSQL with Drizzle ORM. It delivers:

- A clear, modular architecture that scales with demand.
- Secure user authentication via Better Auth and session management.
- A well-defined database schema for users and sessions.
- Easy deployment on Vercel, with Docker support for local and custom hosting.
- Performance-boosting infrastructure: CDN, load balancing, and query optimizations.
- Comprehensive security measures, from encrypted transport to secure cookies.

With this setup, developers can focus on building features rather than wiring up core infrastructure. The clear separation of concerns and everyday language in this document ensure that both technical and non-technical team members understand how the backend works and how it supports the project’s goals.