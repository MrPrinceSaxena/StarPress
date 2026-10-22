// =============================================================================
// Star Press — Fresh Production Reset Script
// Purges all legacy mock orders, test transactions, and test users
// Preserves real products, categories, settings, and verified admin accounts
// =============================================================================

globalThis.WebSocket = class MockWebSocket {};
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  "princesaxena511@gmail.com",
  "starpress.print@gmail.com",
];

async function freshReset() {
  console.log("=================================================");
  console.log("STARTING FRESH PRODUCTION CLEANUP & RESET");
  console.log("=================================================\n");

  // 1. Purge Order Items, Payment Transactions, Refunds, and Orders
  console.log("1. Deleting all orders and payment transactions...");
  const delItems = await prisma.orderItem.deleteMany();
  const delTx = await prisma.paymentTransaction.deleteMany();
  const delRefunds = await prisma.refund.deleteMany();
  const delOrders = await prisma.order.deleteMany();
  console.log(`   • Deleted OrderItems: ${delItems.count}`);
  console.log(`   • Deleted PaymentTransactions: ${delTx.count}`);
  console.log(`   • Deleted Refunds: ${delRefunds.count}`);
  console.log(`   • Deleted Orders: ${delOrders.count}`);

  // 2. Clear Audit Logs
  console.log("\n2. Purging payment audit logs and admin audit logs...");
  const delPaymentAudit = await prisma.paymentAuditLog.deleteMany();
  const delAdminAudit = await prisma.adminAuditLog.deleteMany();
  console.log(`   • Deleted PaymentAuditLogs: ${delPaymentAudit.count}`);
  console.log(`   • Deleted AdminAuditLogs: ${delAdminAudit.count}`);

  // 3. Clear Carts
  console.log("\n3. Clearing temporary carts...");
  const delCartItems = await prisma.cartItem.deleteMany();
  const delCarts = await prisma.cart.deleteMany();
  console.log(`   • Deleted CartItems: ${delCartItems.count}`);
  console.log(`   • Deleted Carts: ${delCarts.count}`);

  // 4. Reset Discount usage counters to 0
  console.log("\n4. Resetting coupon usage counts...");
  const resetDiscounts = await prisma.discount.updateMany({
    data: { usedCount: 0 },
  });
  console.log(`   • Reset ${resetDiscounts.count} discounts to usedCount: 0`);

  // 5. Clean disk fallback store.json
  console.log("\n5. Purging orders from src/data/store.json...");
  if (fs.existsSync("src/data/store.json")) {
    const store = JSON.parse(fs.readFileSync("src/data/store.json", "utf8"));
    const oldOrderCount = store.orders ? store.orders.length : 0;
    store.orders = [];
    fs.writeFileSync("src/data/store.json", JSON.stringify(store, null, 2), "utf8");
    console.log(`   • Cleared ${oldOrderCount} orders from store.json`);
  }

  // 6. Clean test users from Prisma while preserving ADMIN accounts
  console.log("\n6. Cleaning test user accounts from database...");
  const allUsers = await prisma.user.findMany();
  const usersToDelete = allUsers.filter(
    (u) => !ADMIN_EMAILS.includes(u.email.toLowerCase().trim())
  );

  console.log(`   • Total users found: ${allUsers.length}`);
  console.log(`   • Admins preserved: ${ADMIN_EMAILS.join(", ")}`);
  console.log(`   • Test users to remove: ${usersToDelete.length}`);

  for (const u of usersToDelete) {
    try {
      // Remove any inquiries linked to this test user
      await prisma.customizationRequest.deleteMany({ where: { userId: u.id } });
      await prisma.review.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`     - Removed DB user: ${u.email} (${u.name || "No Name"})`);
    } catch (e: any) {
      console.warn(`     ⚠️ Could not delete DB user ${u.email}: ${e.message}`);
    }
  }

  // Ensure Admin accounts in DB have role ADMIN
  for (const adminEmail of ADMIN_EMAILS) {
    await prisma.user.updateMany({
      where: { email: { equals: adminEmail, mode: "insensitive" } },
      data: { role: "ADMIN" },
    });
  }

  // 7. Clean test users from Supabase Auth
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (sbUrl && sbKey) {
    console.log("\n7. Cleaning test users from Supabase Auth...");
    try {
      const supabase = createClient(sbUrl, sbKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await supabase.auth.admin.listUsers();
      if (!error && data?.users) {
        for (const u of data.users) {
          const email = (u.email || "").toLowerCase().trim();
          if (!ADMIN_EMAILS.includes(email)) {
            const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
            if (!delErr) {
              console.log(`     - Deleted Supabase auth user: ${email}`);
            } else {
              console.warn(`     ⚠️ Could not delete Supabase user ${email}: ${delErr.message}`);
            }
          } else {
            // Ensure app_metadata has role: ADMIN
            await supabase.auth.admin.updateUserById(u.id, {
              app_metadata: { role: "ADMIN" },
            });
            console.log(`     ✓ Verified Supabase admin metadata: ${email}`);
          }
        }
      }
    } catch (sbErr: any) {
      console.warn("   Supabase cleanup warning:", sbErr.message);
    }
  }

  // 8. Verification of catalog preservation
  console.log("\n8. Verifying product catalog preservation...");
  const pCount = await prisma.product.count();
  const cCount = await prisma.category.count();
  const sCount = await prisma.storeSetting.count();
  const finalOrders = await prisma.order.count();
  const finalUsers = await prisma.user.findMany({ select: { email: true, role: true } });

  console.log(`   • Products in Catalog: ${pCount} (Preserved)`);
  console.log(`   • Categories in Catalog: ${cCount} (Preserved)`);
  console.log(`   • Store Settings: ${sCount} (Preserved)`);
  console.log(`   • Orders Remaining: ${finalOrders} (Fresh)`);
  console.log(`   • Active Users: ${JSON.stringify(finalUsers)}`);

  console.log("\n=================================================");
  console.log("PRODUCTION RESET COMPLETED SUCCESSFULLY!");
  console.log("=================================================\n");
}

freshReset()
  .catch((err) => {
    console.error("Reset error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
