import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `sub_${Date.now()}`,
    });

    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("Subscription order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
