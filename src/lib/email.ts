import { NotificationEvent } from "@/types";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/constants";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  shopId: string;
}

export function renderTemplate(
  event: NotificationEvent,
  variables: Record<string, string>
): { subject: string; body: string } {
  const template = DEFAULT_EMAIL_TEMPLATES.find((t) => t.event === event);
  if (!template) {
    return { subject: variables.title || "Notification", body: variables.message || "" };
  }

  let subject = template.subject;
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value);
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return { subject, body };
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const res = await fetch("/api/notifications/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

// Provider-ready structure for SMTP / SendGrid / Resend
export interface EmailProviderConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  apiKey?: string;
  provider: "smtp" | "sendgrid" | "resend" | "none";
}

export function getEmailProviderFromEnv(): EmailProviderConfig {
  if (process.env.SMTP_HOST) {
    return {
      provider: "smtp",
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM,
    };
  }
  return { provider: "none" };
}

// WhatsApp / SMS placeholder providers
export interface MessagingProviderConfig {
  whatsappApiKey?: string;
  smsApiKey?: string;
}

export async function sendWhatsApp(_phone: string, _message: string, _apiKey?: string): Promise<boolean> {
  // Provider-ready: integrate Twilio, Gupshup, etc.
  console.info("[WhatsApp] Provider not configured. Message queued.");
  return false;
}

export async function sendSMS(_phone: string, _message: string, _apiKey?: string): Promise<boolean> {
  console.info("[SMS] Provider not configured. Message queued.");
  return false;
}
