# Star Press — Security Operations Manual

**Purpose:** Standard Operating Procedures (SOPs) for operational administrators managing users, security locks, and authentication state.

---

## 1. Unlocking a Locked Customer Account

When a customer triggers account lockout (5 consecutive failed attempts) and calls support:

### Option A: Via Database (Prisma Studio / SQL)
```bash
# Open Prisma Studio locally or on server:
npm run prisma:studio
```
1. Navigate to the `User` table.
2. Search for the customer's email.
3. Set `failedLoginAttempts` = `0`.
4. Set `lockedUntil` = `null`.
5. Click **Save 1 change**.

### Option B: Via Direct SQL Query
```sql
UPDATE "User"
SET "failedLoginAttempts" = 0,
    "lockedUntil" = NULL
WHERE "email" = 'customer@example.com';
```

---

## 2. Resetting an Administrator Password

If an administrator loses access:
```bash
# Generate a fresh 12-round bcrypt hash using node:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewSecurePassword@2026', 12));"
```
Update the record in PostgreSQL:
```sql
UPDATE "User"
SET "passwordHash" = '<generated-hash-above>',
    "failedLoginAttempts" = 0,
    "lockedUntil" = NULL
WHERE "email" = 'admin@starpress.in';
```

---

## 3. Database Backup & Migration Safety

Before running database migrations in production:
```bash
# 1. Take a timestamped PostgreSQL dump
pg_dump "$DATABASE_URL" > "backup-starpress-$(date +%Y%m%d%H%M).sql"

# 2. Verify dump size
ls -lh backup-starpress-*.sql

# 3. Apply Prisma migration
npx prisma migrate deploy
```

---

## 4. Running Security Verification Suite

Run the automated security test suite anytime auth changes are committed:
```bash
npm run test:security
```
This verifies 16 assertions across password policy, rate limiting, lockout timing, and credentials.
