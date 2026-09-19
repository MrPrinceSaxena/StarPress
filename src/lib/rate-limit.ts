/**
 * Star Press Rate Limiter
 * 
 * Current: In-memory sliding window with automatic garbage collection.
 * Phase 3 Upgrade: Seamless switch to Redis for multi-server / distributed deployments.
 * Migration path: Maintain same interface, swap adapter in src/lib/redis-rate-limit.ts.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage across requests in Node / Serverless instance
const store = new Map<string, RateLimitRecord>();

// Garbage collect expired keys every 5 minutes
const GC_INTERVAL_MS = 5 * 60 * 1000;
let lastGC = Date.now();

function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastGC < GC_INTERVAL_MS) return;
  lastGC = now;

  for (const [key, record] of store.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix epoch seconds when the oldest rate-limit hit expires
}

/**
 * Check if an action by an identifier (IP or user email) exceeds limit within a sliding window.
 * 
 * @param identifier Unique key (e.g. `login:192.168.1.1` or `register:user@email.com`)
 * @param limit Maximum allowed events in window
 * @param windowSeconds Time window in seconds
 */
export function rateLimit(
  identifier: string,
  limit = 5,
  windowSeconds = 300 // 5 minutes default
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  cleanupExpiredRecords(windowMs);

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter out timestamps older than current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  const resetTimeMs = record.timestamps.length > 0 ? record.timestamps[0] + windowMs : now + windowMs;
  const resetSeconds = Math.ceil(resetTimeMs / 1000);

  if (record.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetSeconds,
    };
  }

  // Record current attempt
  record.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    reset: resetSeconds,
  };
}

/**
 * Extract client IP address safely from standard proxy headers
 */
export function getClientIp(req: NextRequest | Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Return the first comma-separated client IP
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Helper to generate a standardized 429 Too Many Requests response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const retryAfterSeconds = Math.max(1, result.reset - Math.ceil(Date.now() / 1000));
  const message =
    customMessage ||
    `Too many requests. For security reasons, please wait ${retryAfterSeconds} seconds before trying again.`;

  return NextResponse.json(
    {
      error: message,
      retryAfter: retryAfterSeconds,
      code: "RATE_LIMIT_EXCEEDED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}
