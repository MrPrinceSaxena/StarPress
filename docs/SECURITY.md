# Star Press — Security Architecture & Policy

**Version:** 2.0  
**Status:** ✅ Production Hardened  

---

## 1. Zero-Trust Core & Authentication

### Hardcoded Credentials Policy
Star Press enforces a **strict Zero Hardcoded Credentials Policy**:
- No mock credentials or backdoor admin fallbacks exist in `src/lib/auth.ts` or any backend handlers.
- Credentials must exist in the PostgreSQL database with salted bcrypt hashes.

### Password Policy
- **Minimum Length**: 12 characters
- **Complexity**:
  - At least 1 uppercase letter (`[A-Z]`)
  - At least 1 lowercase letter (`[a-z]`)
  - At least 1 numeric digit (`[0-9]`)
  - At least 1 special character (`[!@#$%^&*()_+-=[]{};':"|,.<>/?]`)
- **Hashing**: `bcrypt` with **12 salt rounds** (~250ms hashing time per attempt to prevent GPU brute-forcing).

### Brute Force & Account Lockout
- **Threshold**: 5 consecutive failed login attempts on an email.
- **Lockout Duration**: 15 minutes.
- **Lockout Behavior**:
  - User cannot log in until `lockedUntil` expires, even if the correct password is provided.
  - Returns `423 Locked` with countdown of minutes remaining.
  - Event is asynchronously logged to `AuthAuditLog`.
- **Timing Attack Mitigation**:
  - Non-existent emails trigger a dummy bcrypt comparison against a pre-hashed string to equalize response times and prevent user enumeration.

---

## 2. Rate Limiting

Rate limiting is enforced at the application layer via `src/lib/rate-limit.ts`:
- **Sliding Window**: Accurate millisecond-resolution sliding window with automated garbage collection.
- **Rules**:
  - `POST /api/auth/register`: 5 attempts per 15 minutes per IP.
  - `POST /api/auth/callback/credentials`: 5 attempts per 5 minutes per IP.
  - `POST /api/auth/forgot-password`: 3 requests per 15 minutes per IP.
- **Response**: Standard HTTP `429 Too Many Requests` with `Retry-After` header.

---

## 3. HTTP Security Headers

Injected on all responses via `src/middleware.ts`:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforce HTTPS strictly |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME confusion attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protect URL parameters in referrers |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unneeded browser APIs |
| `X-XSS-Protection` | `1; mode=block` | Legacy browser XSS filter |

---

## 4. Audit Logging (`AuthAuditLog`)

All security-sensitive operations record immutable audit entries:
- `LOGIN_SUCCESS`, `LOGIN_FAILURE`
- `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`
- `REGISTER`, `LOGOUT`
- `PASSWORD_CHANGE`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS`
- `EMAIL_VERIFIED`, `TWO_FACTOR_ENABLED`

Logged data includes:
- Timestamp (UTC)
- Email address & User ID
- Client IP address (from `X-Forwarded-For` / `CF-Connecting-IP`)
- User-Agent string
- Status (`SUCCESS` / `FAILURE`) & diagnostic reason
