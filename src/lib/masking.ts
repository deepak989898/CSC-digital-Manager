/** Mask sensitive ID numbers for display and storage */

export function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX";
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function extractAadhaarLast4(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4);
}

export function maskPan(value: string): string {
  if (value.length < 4) return "XXXXX****";
  return value.slice(0, 5) + "****" + value.slice(-1);
}

export function maskValue(key: string, value: string): string {
  const k = key.toLowerCase();
  if (k.includes("aadhaar")) return maskAadhaar(value);
  if (k.includes("pan")) return maskPan(value);
  if (k.includes("account") || k.includes("passbook")) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 4) return "****" + digits.slice(-4);
  }
  return value;
}

export const AADHAAR_DISCLAIMER =
  "This system stores only Aadhaar last 4 digits by default. Full Aadhaar numbers are masked. " +
  "We do not generate, edit, or forge government identity documents. " +
  "Use extracted data only for legitimate CSC service processing with customer consent.";

export const OCR_CONSENT_TEXT =
  "I confirm that I have the customer's consent to process this document for OCR data extraction only. " +
  "The original document will not be modified.";

export const ESIGN_CONSENT_TEXT =
  "I confirm that the signer has been informed and consents to electronic signature as per applicable law.";
