# Star Press — Security Incident Response Plan (SIRP)

**Classification:** Internal Confidential  
**Escalation Contact:** `security@starpress.in` / `admin@starpress.in`  

---

## 1. Incident Severity Levels

| Severity | Definition | Examples | SLA |
|---|---|---|---|
| **P1 - Critical** | Active breach, data exfiltration, database compromise | Unauthorized access to customer table, payment keys leaked | 15 mins |
| **P2 - High** | Targeted brute-force attacks, high rate of lockouts | Attacker attempting credential stuffing on 500+ accounts | 1 hour |
| **P3 - Medium** | Single account takeover attempt, suspicious password resets | Unusual IP geolocation activity | 4 hours |
| **P4 - Low** | Routine security vulnerability report, rate limit trip | Single user locked out | 24 hours |

---

## 2. Immediate Triage & Containment

### If Credential Stuffing / Brute Force Detected:
1. **Query `AuthAuditLog` table**:
   ```sql
   SELECT "ipAddress", COUNT(*) as attempts
   FROM "AuthAuditLog"
   WHERE "action" = 'LOGIN_FAILURE'
     AND "createdAt" > NOW() - INTERVAL '1 hour'
   GROUP BY "ipAddress"
   ORDER BY attempts DESC
   LIMIT 10;
   ```
2. **Block Malicious IP at Cloudflare / Vercel Firewall**:
   - Add offending IP or IP CIDR block to WAF Blocklist.
3. **Lock Affected Accounts**:
   - Temporarily set `lockedUntil = NOW() + INTERVAL '2 hours'` for target accounts.

---

## 3. Session Revocation & Key Invalidation

If NextAuth secret is suspected to be compromised:
1. Generate new 32-character random key:
   ```bash
   openssl rand -base64 32
   ```
2. Update `NEXTAUTH_SECRET` in Vercel Project Settings > Environment Variables.
3. Trigger immediate redeployment: all existing JWT session cookies become instantly invalidated globally.
