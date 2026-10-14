/**
 * Star Press - Razorpay Webhook Security
 * Defense-in-depth: IP allowlisting for Razorpay webhook origin verification
 */

// Razorpay's documented webhook source IPs
const RAZORPAY_WEBHOOK_IPS = [
  "52.66.166.10",
  "52.66.116.30",
  "52.66.171.30",
  "52.66.120.130",
  "52.66.33.236",
  "52.66.121.30",
];

export function isAllowedWebhookSource(ip: string): boolean {
  if (process.env.NODE_ENV !== "production") return true; // Skip in dev/test
  if (!ip) return false;

  const trimmedIp = ip.trim();

  // Allow dynamic addition via RAZORPAY_WEBHOOK_IPS env var (comma-separated)
  const envIps = process.env.RAZORPAY_WEBHOOK_IPS
    ? process.env.RAZORPAY_WEBHOOK_IPS.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const allAllowed = [...RAZORPAY_WEBHOOK_IPS, ...envIps];
  return allAllowed.includes(trimmedIp);
}
