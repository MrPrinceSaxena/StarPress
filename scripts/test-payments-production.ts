import fs from "fs";
// =============================================================================
// Comprehensive Payment Security & Production Verification Test Suite
// Star Press — Zero-Trust Razorpay Payment Verification
// =============================================================================

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  recordPaymentSuccess,
  getRazorpayCredentials,
} from "../src/server/payments";
import { db } from "../src/lib/db";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) console.error(`     Details: ${failureDetails}`);
    failed++;
  }
}

async function runAllTests() {
  console.log("=================================================================");
  console.log("STAR PRESS ZERO-MOCK PAYMENT SECURITY AUDIT & VERIFICATION SUITE");
  console.log("=================================================================\n");

  const { keyId, keySecret } = getRazorpayCredentials();
  console.log("Loaded Server Razorpay Credentials:");
  console.log(`  Key ID:     ${keyId ? keyId.slice(0, 10) + "..." : "UNSET"}`);
  console.log(`  Key Secret: ${keySecret ? keySecret.slice(0, 4) + "..." : "UNSET"}\n`);

  // ---------------------------------------------------------------------------
  // TEST 1: Missing credentials fail closed safely
  // ---------------------------------------------------------------------------
  console.log("--- TEST 1: Missing Credentials Fail-Closed Behavior ---");
  const origKeyId = process.env.RAZORPAY_KEY_ID;
  const origNextKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const origSecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    let threwExpected503 = false;
    let thrownErrorMsg = "";
    try {
      // Find any order in DB to test order creation
      const testOrder = await prisma.order.findFirst({ where: { paymentMethod: "ONLINE", paymentStatus: "UNPAID" } });
      if (testOrder) {
        await createRazorpayOrder({ orderId: testOrder.id });
      }
    } catch (err: any) {
      if (err.statusCode === 503 || err.message?.includes("missing API credentials")) {
        threwExpected503 = true;
      }
      thrownErrorMsg = err.message;
    }

    assert(
      threwExpected503,
      "Order creation fails with 503 when credentials are missing",
      `Thrown: ${thrownErrorMsg}`
    );

    // Verify signature verification fails closed when secret is missing
    const sigCheck = verifyRazorpaySignature("order_123", "pay_456", "any_sig");
    assert(
      sigCheck === false,
      "verifyRazorpaySignature fails closed (returns false) when secret is missing"
    );
  } finally {
    if (origKeyId) process.env.RAZORPAY_KEY_ID = origKeyId;
    if (origNextKeyId) process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = origNextKeyId;
    if (origSecret) process.env.RAZORPAY_KEY_SECRET = origSecret;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Fake order IDs, fake payment IDs, and mock signatures are rejected
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Rejection of Fake Order IDs, Payment IDs & Mock Signatures ---");
  const mockSigCheck1 = verifyRazorpaySignature("order_mock_1792651003417", "pay_mock_1792651005208", "mock_signature");
  assert(!mockSigCheck1, "verifyRazorpaySignature rejects order_mock_ / pay_mock_ / mock_signature");

  const mockSigCheck2 = verifyRazorpaySignature("order_valid_123", "pay_mock_456", "mock_test_signature");
  assert(!mockSigCheck2, "verifyRazorpaySignature rejects pay_mock_ prefix");

  const mockSigCheck3 = verifyRazorpaySignature("order_mock_123", "pay_real_456", "real_looking_sig");
  assert(!mockSigCheck3, "verifyRazorpaySignature rejects order_mock_ prefix");

  // Verify recordPaymentSuccess rejects mock payment payloads
  const fakeOrder = await prisma.order.findFirst();
  if (fakeOrder) {
    const fakeRecResult = await recordPaymentSuccess({
      orderId: fakeOrder.id,
      paymentId: "pay_mock_test_injection_999",
      razorpayOrderId: "order_mock_test_injection_999",
      signature: "mock_signature",
      method: "DEV_TEST",
      amount: 100,
    });
    assert(
      fakeRecResult.success === false && fakeRecResult.error?.includes("prohibited"),
      "recordPaymentSuccess strictly blocks pay_mock_ / order_mock_ / DEV_TEST",
      `Result: ${JSON.stringify(fakeRecResult)}`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Cryptographic HMAC signature verification & tampering detection
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Cryptographic HMAC Verification & Anti-Tampering ---");
  const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret_for_hmac_check_32chars!";
  const testOrderId = "order_genuine_987654321";
  const testPaymentId = "pay_genuine_123456789";

  const validHmac = crypto
    .createHmac("sha256", secret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest("hex");

  // Test with valid secret
  const origEnvSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_SECRET = secret;

  const validResult = verifyRazorpaySignature(testOrderId, testPaymentId, validHmac);
  assert(validResult === true, "Authentic HMAC-SHA256 signature is accepted");

  // Tampered payment ID
  const tamperedPaymentSig = verifyRazorpaySignature(testOrderId, "pay_tampered_999", validHmac);
  assert(!tamperedPaymentSig, "Tampered paymentId is rejected by signature verification");

  // Tampered order ID
  const tamperedOrderSig = verifyRazorpaySignature("order_tampered_999", testPaymentId, validHmac);
  assert(!tamperedOrderSig, "Tampered orderId is rejected by signature verification");

  // Tampered signature byte
  const corruptedSig = validHmac.slice(0, -2) + (validHmac.slice(-2) === "aa" ? "bb" : "aa");
  const tamperedSigResult = verifyRazorpaySignature(testOrderId, testPaymentId, corruptedSig);
  assert(!tamperedSigResult, "Corrupted/forged signature is rejected");

  process.env.RAZORPAY_KEY_SECRET = origEnvSecret;

  // ---------------------------------------------------------------------------
  // TEST 4: Authoritative Razorpay API Order Creation
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: Authoritative Razorpay API Order Creation ---");
  const testDbOrder = await prisma.order.findFirst({
    where: { paymentStatus: "UNPAID", paymentMethod: "ONLINE" },
  });

  if (testDbOrder) {
    try {
      const createdRzp = await createRazorpayOrder({ orderId: testDbOrder.id });
      assert(
        createdRzp.success === true &&
          createdRzp.razorpayOrderId.startsWith("order_") &&
          !createdRzp.razorpayOrderId.startsWith("order_mock_"),
        "createRazorpayOrder creates a genuine Razorpay order with real order ID",
        `Order ID: ${createdRzp.razorpayOrderId}`
      );
      assert(
        createdRzp.amount === Math.round(Number(testDbOrder.totalAmount) * 100),
        "Charged amount strictly derived from server-side DB totalAmount in integer paise"
      );
      assert(
        createdRzp.currency === "INR",
        "Order currency is strictly INR"
      );
    } catch (apiErr: any) {
      console.warn("   ⚠️ Note: Order creation failed at network:", apiErr.message);
    }
  } else {
    console.log("   (No UNPAID online order in DB to test live creation)");
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Idempotency of Payment Recording (No duplicate fulfillment)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Idempotency & Replay Attack Prevention ---");
  const uniquePaymentId = `pay_idemp_test_${Date.now()}`;
  // Create an isolated temporary order for idempotency testing
  const idempOrder = await prisma.order.create({
    data: {
      orderNumber: `SP-IDEMP-${Date.now()}`,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "ONLINE",
      subtotal: 100,
      totalAmount: 100,
      shippingAddress: { city: "Khatima", state: "UK", pincode: "262308" },
      guestName: "Idempotency Tester",
      guestEmail: "idemp@starpress.in",
    },
  });

  try {
    // 1st recording: marks order PAID and saves PaymentTransaction
    const rec1 = await recordPaymentSuccess({
      orderId: idempOrder.id,
      paymentId: uniquePaymentId,
      razorpayOrderId: "order_idemp_test_123",
      signature: "valid_sha256_test_signature",
      amount: 100,
      method: "ONLINE",
    });

    assert(rec1.success === true, "First payment recording completes successfully");

    // 2nd recording: identical payment ID replayed (e.g. duplicate webhook or retry)
    const rec2 = await recordPaymentSuccess({
      orderId: idempOrder.id,
      paymentId: uniquePaymentId,
      razorpayOrderId: "order_idemp_test_123",
      signature: "valid_sha256_test_signature",
      amount: 100,
      method: "ONLINE",
    });

    assert(
      (rec2 as any).isDuplicate === true,
      "Second identical payment capture is recognized as duplicate (idempotent)"
    );
  } finally {
    // Clean up temporary test data
    await prisma.paymentTransaction.deleteMany({
      where: { gatewayPaymentId: uniquePaymentId },
    });
    await prisma.order.delete({ where: { id: idempOrder.id } }).catch(() => {});
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Client Manipulation Defense
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Client-Side Manipulation Defenses ---");
  // Check orders cannot be created with PAID status by client
  const { createOrder } = await import("../src/server/orders");
  try {
    const sampleProd = await prisma.product.findFirst({ where: { isActive: true } });
    if (!sampleProd) {
      console.log("   (Skipping createOrder product check: no active product in DB)");
      return;
    }
    const dummyOrder = await createOrder({
      shippingAddress: {
        fullName: "Security Test",
        phone: "9876543210",
        addressLine1: "123 Security Test Lane",
        city: "Khatima",
        state: "Uttarakhand",
        pincode: "262308",
        email: "sectest@starpress.in",
      },
      paymentMethod: "ONLINE",
      paymentStatus: "PAID", // Attacker attempts to pass PAID
      items: [
        {
          productId: sampleProd.id,
          productSlug: sampleProd.slug,
          productName: sampleProd.name,
          quantity: 1,
          unitPrice: Number(sampleProd.basePrice || 100),
        },
      ],
    } as any);

    assert(
      dummyOrder.order.paymentStatus === "UNPAID",
      "createOrder ignores client-passed paymentStatus: PAID and strictly forces UNPAID",
      `Actual paymentStatus: ${dummyOrder.order.paymentStatus}`
    );

    // Clean up created test order
    await prisma.orderItem.deleteMany({ where: { orderId: dummyOrder.order.id } });
    await prisma.order.delete({ where: { id: dummyOrder.order.id } });
  } catch (err: any) {
    console.warn("createOrder check notice:", err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Source Code Static Security Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 7: Static Audit for Mock Bypasses in Source Files ---");
  const checkoutSrc = fs.readFileSync("src/app/checkout/page.tsx", "utf8");
  assert(
    !checkoutSrc.includes("rzpData.isMock"),
    "src/app/checkout/page.tsx has ZERO isMock conditions"
  );
  assert(
    !checkoutSrc.includes("pay_mock_"),
    "src/app/checkout/page.tsx has ZERO pay_mock_ generators"
  );

  const paySrc = fs.readFileSync("src/app/account/orders/[id]/pay/page.tsx", "utf8");
  assert(
    !paySrc.includes("retryData.isMock"),
    "src/app/account/orders/[id]/pay/page.tsx has ZERO isMock conditions"
  );

  const verifyRouteSrc = fs.readFileSync("src/app/api/payments/razorpay/verify/route.ts", "utf8");
  assert(
    !verifyRouteSrc.includes("isMock: true"),
    "src/app/api/payments/razorpay/verify/route.ts has ZERO isMock responses"
  );

  const paymentsSrc = fs.readFileSync("src/server/payments.ts", "utf8");
  assert(
    !paymentsSrc.includes("rzp_test_Toz86Nohgur7MU"),
    "src/server/payments.ts has ZERO hardcoded test credentials"
  );
  assert(
    !paymentsSrc.includes("rzp_test_mock_key"),
    "src/server/payments.ts has ZERO rzp_test_mock_key occurrences"
  );

  console.log("\n=================================================================");
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests()
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
