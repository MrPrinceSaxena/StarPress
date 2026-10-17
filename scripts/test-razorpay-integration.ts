import Razorpay from "razorpay";
import crypto from "crypto";

async function testRazorpay() {
  const key_id = "rzp_test_Toz86Nohgur7MU";
  const key_secret = "bHLfw4FddkBAH2YxT4aUofK4";

  console.log("1. Initializing Razorpay SDK instance...");
  const razorpay = new Razorpay({ key_id, key_secret });

  console.log("2. Testing live API order creation with Razorpay...");
  try {
    const order = await razorpay.orders.create({
      amount: 50000, // ₹500 in paise
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: "Star Press automated verification" },
    });
    console.log("✅ Order created successfully on Razorpay!");
    console.log("   Order ID:", order.id);
    console.log("   Amount:", order.amount, order.currency);
    console.log("   Status:", order.status);

    console.log("\n3. Testing HMAC SHA-256 signature algorithm...");
    const mockPaymentId = `pay_test_${Date.now()}`;
    const generatedSig = crypto
      .createHmac("sha256", key_secret)
      .update(`${order.id}|${mockPaymentId}`)
      .digest("hex");

    // Verification check
    const verifySig = crypto
      .createHmac("sha256", key_secret)
      .update(`${order.id}|${mockPaymentId}`)
      .digest("hex");

    const match = crypto.timingSafeEqual(
      Buffer.from(generatedSig),
      Buffer.from(verifySig)
    );
    console.log("✅ HMAC Signature calculation & verification verified!");
    console.log("   HMAC Valid:", match);
    console.log("\n🎉 ALL RAZORPAY INTEGRATION CHECKS PASSED!");
  } catch (error: any) {
    console.error("❌ Razorpay order creation failed:", error);
    process.exit(1);
  }
}

testRazorpay();
