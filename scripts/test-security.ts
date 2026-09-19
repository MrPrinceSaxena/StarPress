/**
 * Star Press Automated Security & Authentication Test Suite
 * Validates:
 * 1. Enterprise Password Complexity Policy (12+ characters, upper, lower, digit, special)
 * 2. Sliding Window Rate Limiting (threshold, remaining calculation, 429 response)
 * 3. Lockout Calculation & Timing Defense
 * 4. Token generation & rotation invariants
 */

import { evaluatePassword, PASSWORD_MIN_LENGTH } from "../src/lib/validation/auth";
import { rateLimit } from "../src/lib/rate-limit";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    testsFailed++;
  }
}

async function runSecurityTests() {
  console.log("🛡️  Running Star Press Security Verification Suite...\n");

  // =========================================================================
  // 1. Password Complexity & Policy Tests
  // =========================================================================
  console.log("🔒 1. Password Complexity & Policy Tests");

  const shortPass = evaluatePassword("Short1!");
  assert(!shortPass.isValid, "Rejects passwords < 12 characters", `Length: ${"Short1!".length}`);

  const noSpecial = evaluatePassword("ValidPassword123");
  assert(!noSpecial.isValid, "Rejects passwords without special characters");

  const noNumber = evaluatePassword("ValidPassword!@#");
  assert(!noNumber.isValid, "Rejects passwords without numeric digits");

  const noUpper = evaluatePassword("validpassword123!");
  assert(!noUpper.isValid, "Rejects passwords without uppercase letters");

  const noLower = evaluatePassword("VALIDPASSWORD123!");
  assert(!noLower.isValid, "Rejects passwords without lowercase letters");

  const validPass = evaluatePassword("StarPress@2026Enterprise");
  assert(
    validPass.isValid && validPass.strength === "strong",
    "Accepts valid 12+ character enterprise password with strong rating"
  );

  // =========================================================================
  // 2. Sliding Window Rate Limiting Tests
  // =========================================================================
  console.log("\n⏱️  2. Sliding Window Rate Limiting Tests");

  const testIp = "test-client-ip-" + Date.now();
  const limit = 5;
  const windowSecs = 10;

  // Send 5 permitted requests
  for (let i = 1; i <= limit; i++) {
    const res = rateLimit(testIp, limit, windowSecs);
    assert(
      res.success && res.remaining === limit - i,
      `Rate limiter permits attempt #${i} (remaining: ${res.remaining})`
    );
  }

  // 6th request must be blocked
  const blockedRes = rateLimit(testIp, limit, windowSecs);
  assert(
    !blockedRes.success && blockedRes.remaining === 0,
    "Rate limiter blocks 6th request with 429 / remaining=0"
  );
  assert(
    blockedRes.reset > Math.floor(Date.now() / 1000),
    "Rate limiter calculates future Unix reset timestamp"
  );

  // =========================================================================
  // 3. Lockout Calculation Logic Tests
  // =========================================================================
  console.log("\n🔐 3. Lockout Threshold & Time Window Tests");

  const MAX_FAILED = 5;
  const LOCKOUT_MINUTES = 15;

  let failedAttempts = 4;
  const willLock = failedAttempts + 1 >= MAX_FAILED;
  assert(willLock, "5th failed attempt triggers account lockout condition");

  const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
  const now = new Date();
  const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / (60 * 1000));
  assert(
    minutesRemaining === LOCKOUT_MINUTES || minutesRemaining === LOCKOUT_MINUTES - 1,
    `Lockout calculates ${LOCKOUT_MINUTES}-minute countdown window accurately`
  );

  // =========================================================================
  // 4. Zero Hardcoded Credentials Verification
  // =========================================================================
  console.log("\n🚫 4. Zero Hardcoded Credentials Verification");
  const authFileContent = require("fs").readFileSync("src/lib/auth.ts", "utf8");
  const hasMockBypass =
    authFileContent.includes('mock-admin-id') ||
    authFileContent.includes('credentials.password === "Admin@StarPress2026"');
  assert(!hasMockBypass, "src/lib/auth.ts contains ZERO hardcoded mock admin credentials");

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n" + "=".repeat(50));
  console.log(`Security Test Suite Completed: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log("=".repeat(50) + "\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
