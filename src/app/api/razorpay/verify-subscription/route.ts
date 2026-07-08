import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { addDays } from "date-fns";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) return initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle, shopId, userId } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });

    const expectedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expectedSignature !== razorpay_signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const adminDb = getFirestore(getAdminApp());
    const planSnap = await adminDb.collection("plans").doc(planId).get();
    if (!planSnap.exists) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const plan = planSnap.data()!;
    const start = new Date();
    const days = billingCycle === "yearly" ? 365 : 30;
    const expiry = addDays(start, days);
    const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const timestamp = new Date().toISOString();

    const existing = await adminDb.collection("subscriptions").where("shopId", "==", shopId).get();
    for (const doc of existing.docs) {
      const data = doc.data();
      if (data.status === "active" || data.status === "trial") {
        await doc.ref.update({ status: "cancelled", updatedAt: timestamp });
      }
    }

    await adminDb.collection("subscriptions").add({
      planId,
      planName: plan.name,
      status: "active",
      billingCycle,
      startDate: timestamp,
      expiryDate: expiry.toISOString(),
      amount,
      transactionId: razorpay_payment_id,
      autoRenew: false,
      userId,
      shopId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
