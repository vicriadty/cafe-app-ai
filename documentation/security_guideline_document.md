# Security Guidelines for `cafe-app-ai`

This document defines the security principles, practices, and controls to apply when developing, deploying, and operating the `cafe-app-ai` full-stack starter template. It aligns with Security by Design and Defense in Depth principles to protect user data, credentials, and application integrity.

---

## 1. Authentication & Access Control

### 1.1 Robust Authentication
- **Better Auth Integration**: Ensure all sign-up, sign-in, password reset, and session-management flows use the official Better Auth SDK or API. Do not bypass or reimplement core authentication logic.
- **Password Policies**: Enforce minimum length (12+ characters), complexity (mixed case, numbers, symbols), and reuse restrictions. Let Better Auth enforce rotation or MFA if supported.
- **MFA (Multi-Factor Authentication)**: Offer SMS, TOTP, or authenticator-app based MFA for sensitive accounts. Require MFA for any admin-level or privileged operations.

### 1.2 Secure Session Management
- **Cookies**: Store session tokens/cookies with `Secure`, `HttpOnly`, and `SameSite=Strict`. Avoid storing JWTs in localStorage or other client-accessible storage.
- **Session Timeouts**: Configure both idle and absolute timeouts. For example, idle: 15 min, absolute: 24 h.
- **Session Revocation**: Provide logout endpoints that properly invalidate server-side sessions or JWTs.
- **Prevent Session Fixation**: Always issue a new session identifier upon authentication.

### 1.3 Role-Based Access Control (RBAC)
- **Define Roles & Permissions**: At minimum, use `guest`, `user`, and `admin` roles. Map routes and API endpoints to required roles.
- **Server-Side Checks**: Reject unauthorized requests server-side in Next.js API routes (`/api/*`) and in any getServerSideProps or middleware functions.
- **Least Privilege**: Grant minimal permissions to database users for each role. E.g., read-only vs. read/write.

---

## 2. Input Handling & Processing

### 2.1 Server-Side Validation
- Use a robust validation library (e.g., Zod or Joi) in every API route and server component boundary. Never rely solely on client-side checks.
- Validate payload size, types, formats (e.g., email regex), and enforce length limits.

### 2.2 Injection Prevention
- **ORM Usage**: Always use Drizzle ORM’s parameterized queries to prevent SQL injection. Avoid raw SQL strings or string concatenation.
- **Command Injections**: If using `exec` or `spawn` anywhere (e.g., in scripts), strictly validate and whitelist inputs.

### 2.3 XSS & Output Encoding
- Encode all user-supplied data before rendering in React. Prefer React’s built-in escaping.
- When using `dangerouslySetInnerHTML`, sanitize input with a vetted library (e.g., DOMPurify).
- Implement a Content Security Policy (CSP) header to restrict executable sources.

### 2.4 File Uploads (If Applicable)
- Validate file MIME types, extensions, and file sizes on the server.
- Store uploads outside the webroot or in a secured cloud storage bucket with restricted permissions.
- Scan uploads for malware if processing untrusted files.

---

## 3. Data Protection & Privacy

### 3.1 Encryption
- **In Transit**: Enforce HTTPS/TLS 1.2+ for all user and API traffic. Set HSTS headers (`Strict-Transport-Security`).
- **At Rest**: Configure PostgreSQL to encrypt data files (TDE) or use field-level encryption for sensitive PII.

### 3.2 Secrets Management
- **No Hardcoding**: Store all API keys, database credentials, and third-party secrets in environment variables or a secrets management tool (e.g., AWS Secrets Manager, Vault).
- **Rotation**: Rotate secrets periodically and after any suspected compromise.

### 3.3 Data Minimization & Privacy
- Only collect and store PII strictly necessary for business logic.
- Safer default pagination: never return entire user lists unpaged in API responses.
- Mask or redact PII (e.g., email addresses) in logs and error messages.

---

## 4. API & Service Security

### 4.1 Rate Limiting & Throttling
- Implement rate limiting (e.g., 100 requests/min) on Next.js API routes to mitigate brute-force and DoS attacks. Consider using middleware like `express-rate-limit` or cloud provider features.

### 4.2 CORS & CSRF
- **CORS**: Restrict to known origins (e.g., `https://yourapp.com`). Deny all others by default.
- **CSRF Protection**: Use synchronized CSRF tokens for state-changing operations (POST/PUT/DELETE). NextAuth or custom middleware can provide this.

### 4.3 API Versioning & Least Exposure
- Prefix API routes with `/api/v1/`. Avoid exposing internal or debugging endpoints in production.
- Return only necessary fields in JSON responses. Strip out internal IDs or sensitive flags.

---

## 5. Web Application Security Hygiene

### 5.1 Security Headers
Configure the following HTTP headers in Next.js (e.g., via `next.config.js` or a custom server):
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer-when-downgrade`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### 5.2 Secure Cookies
- Always set `Secure` and `HttpOnly` on session cookies.
- Use `SameSite=Strict` or `Lax` to mitigate CSRF.

### 5.3 Clickjacking & Clickjacking Prevention
- Disallow framing by third parties (`X-Frame-Options: DENY`).

---

## 6. Infrastructure & Configuration Management

### 6.1 Docker Hardening
- Base images: Choose minimal, up-to-date images (e.g., `node:18-alpine`).
- Drop unnecessary privileges: run application as non-root user.
- Scan images with SCA tools (e.g., Trivy) before deployment.

### 6.2 Server & Cloud Configuration
- Rotate SSH keys and avoid password-based logins.
- Open only essential ports (e.g., 80/443). Block all others via firewall rules.
- Disable debug flags and development logging in production.

### 6.3 TLS/SSL Configuration
- Use strong cipher suites only. Disable SSLv3, TLS 1.0, and 1.1.
- Regularly renew and audit TLS certificates.

---

## 7. Dependency Management & Supply Chain Security

- **Lockfiles**: Commit `package-lock.json` or `yarn.lock` to ensure deterministic builds.
- **Vulnerability Scanning**: Integrate automated scanning (e.g., GitHub Dependabot, Snyk) to detect CVEs in dependencies.
- **Minimal Footprint**: Only install libraries you actively use. Remove unused packages.
- **Pin Versions**: Avoid floating version ranges (`^` or `~`) for critical security dependencies.

---

## 8. Logging, Monitoring & Incident Response

- **Structured Logging**: Log at INFO/WARN/ERROR levels. Avoid PII in logs.
- **Centralized Monitoring**: Send logs to a SIEM or log-aggregation service (e.g., ELK Stack, Datadog).
- **Alerts**: Configure alerts for repeated failed logins, high error rates, or unusual traffic spikes.
- **Incident Playbook**: Define roles, communication channels, and recovery steps for security incidents.

---

## 9. Developer Practices & Code Reviews

- **Code Reviews**: Enforce peer review for all pull requests, focusing on security implications of changes.
- **Static Analysis**: Integrate ESLint, TypeScript strict mode, and security linters (e.g., eslint-plugin-security).
- **Testing**: Write unit tests for validation logic and integration/E2E tests for auth flows (Vitest, Jest, Playwright).
- **Threat Modeling**: Periodically review the application architecture to identify and mitigate new threats.

---

## 10. Continuous Improvement
- **Regular Audits**: Conduct quarterly security reviews and pen tests.
- **Stay Updated**: Subscribe to CVE feeds, Better Auth security bulletins, and Next.js/Node.js advisory channels.
- **Training**: Keep the team informed on secure coding practices, OWASP Top 10, and emerging threats.

---

Adherence to these guidelines will ensure that `cafe-app-ai` remains a secure, robust foundation for any web application built on it. Regularly revisit and update these controls as the codebase and threat landscape evolve.