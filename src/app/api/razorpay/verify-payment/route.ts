import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function getPaymentStatus(fee: number, paid: number): string {
  if (paid <= 0) return "unpaid";
  if (paid < fee) return "partial";
  return "paid";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
      shopId,
      userId,
      customerId,
      customerName,
      serviceId,
      serviceName,
      applicationRef,
      shopName,
      ownerName,
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const adminDb = getFirestore(getAdminApp());
    const appRef = adminDb.collection("applications").doc(applicationId);
    const appSnap = await appRef.get();

    if (!appSnap.exists) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const appData = appSnap.data()!;
    const amount = (appData.applicationFee || 0) - (appData.amountPaid || 0);
    const payAmount = amount > 0 ? amount : appData.applicationFee || 0;
    const newAmountPaid = (appData.amountPaid || 0) + payAmount;
    const paymentStatus = getPaymentStatus(appData.applicationFee || 0, newAmountPaid);

    const paymentsSnap = await adminDb
      .collection("payments")
      .where("shopId", "==", shopId)
      .get();
    const receiptNum = `RCP${String(paymentsSnap.size + 1).padStart(3, "0")}`;
    const timestamp = new Date().toISOString();

    const paymentRef = await adminDb.collection("payments").add({
      customerId,
      customerName,
      applicationId,
      applicationRef,
      serviceId,
      serviceName,
      amount: payAmount,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      transactionId: razorpay_payment_id,
      notes: `Razorpay Order: ${razorpay_order_id}`,
      paymentDate: timestamp,
      userId,
      shopId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await appRef.update({
      amountPaid: newAmountPaid,
      paymentStatus,
      updatedAt: timestamp,
    });

    const receiptRef = await adminDb.collection("receipts").add({
      receiptNumber: receiptNum,
      customerId,
      customerName,
      applicationId,
      applicationRef,
      serviceName,
      amount: payAmount,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      paymentId: paymentRef.id,
      shopName: shopName || "CSC Shop",
      ownerName: ownerName || "",
      userId,
      shopId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return NextResponse.json({
      success: true,
      receiptId: receiptRef.id,
      paymentId: paymentRef.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
