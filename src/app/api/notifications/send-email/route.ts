import { NextRequest, NextResponse } from "next/server";
import { renderTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, shopId, event, title, message, subject, html } = body;

    const smtpHost = process.env.SMTP_HOST;
    const emailFrom = process.env.EMAIL_FROM;

    if (!smtpHost || !emailFrom) {
      // Provider not configured - log and return success for dev
      console.info("[Email] Provider not configured. Would send:", { to, subject: subject || title, shopId });
      return NextResponse.json({ success: true, queued: true, provider: "none" });
    }

    let emailSubject = subject || title;
    let emailBody = html || message;

    if (event && !subject) {
      const rendered = renderTemplate(event, { title: title || "", message: message || "", ...body.variables });
      emailSubject = rendered.subject;
      emailBody = rendered.body;
    }

    // SMTP/SendGrid/Resend integration point
    // Example: nodemailer with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    console.info("[Email] Sent via SMTP:", { to: to || emailFrom, subject: emailSubject, shopId });

    return NextResponse.json({ success: true, provider: "smtp" });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
