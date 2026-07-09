import { OcrDocumentType, OcrField, OcrProvider } from "@/types";
import { extractAadhaarLast4, maskValue } from "./masking";

export interface OcrProcessInput {
  documentType: OcrDocumentType;
  rawText: string;
  provider: OcrProvider;
}

export interface OcrProcessResult {
  fields: OcrField[];
  overallConfidence: number;
  provider: OcrProvider;
}

const FIELD_TEMPLATES: Record<OcrDocumentType, { key: string; label: string; pattern?: RegExp; sensitive?: boolean }[]> = {
  aadhaar: [
    { key: "name", label: "Name", pattern: /(?:name|नाम)[:\s]+([A-Za-z\s]+)/i },
    { key: "dob", label: "Date of Birth", pattern: /(?:dob|birth|जन्म)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4})/i },
    { key: "gender", label: "Gender", pattern: /(?:male|female|transgender|पुरुष|महिला)/i },
    { key: "address", label: "Address", pattern: /(?:address|पता)[:\s]+(.{10,80})/i },
    { key: "aadhaar_last4", label: "Aadhaar Last 4", pattern: /\b(\d{4})\s?\d{4}\s?(\d{4})\b/, sensitive: true },
  ],
  pan: [
    { key: "name", label: "Name", pattern: /(?:name)[:\s]+([A-Za-z\s]+)/i },
    { key: "father_name", label: "Father's Name", pattern: /(?:father)[:\s]+([A-Za-z\s]+)/i },
    { key: "dob", label: "Date of Birth", pattern: /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/ },
    { key: "pan_number", label: "PAN Number", pattern: /([A-Z]{5}\d{4}[A-Z])/i, sensitive: true },
  ],
  voter_id: [
    { key: "name", label: "Name", pattern: /(?:name|नाम)[:\s]+([A-Za-z\s]+)/i },
    { key: "epic_number", label: "EPIC Number", pattern: /([A-Z]{3}\d{7})/i },
    { key: "address", label: "Address" },
  ],
  driving_license: [
    { key: "name", label: "Name" },
    { key: "dl_number", label: "DL Number", pattern: /([A-Z]{2}\d{2}\s?\d{11})/i },
    { key: "dob", label: "Date of Birth", pattern: /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/ },
    { key: "valid_upto", label: "Valid Upto", pattern: /(?:valid|upto)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i },
  ],
  passport: [
    { key: "name", label: "Name" },
    { key: "passport_number", label: "Passport Number", pattern: /([A-Z]\d{7})/i, sensitive: true },
    { key: "dob", label: "Date of Birth" },
    { key: "nationality", label: "Nationality" },
  ],
  marksheet: [
    { key: "student_name", label: "Student Name" },
    { key: "roll_number", label: "Roll Number", pattern: /(?:roll|reg)[:\s#]*(\w+)/i },
    { key: "board", label: "Board/University" },
    { key: "year", label: "Year", pattern: /(20\d{2}|19\d{2})/ },
    { key: "percentage", label: "Percentage", pattern: /(\d{1,3}(?:\.\d+)?)\s*%/ },
    { key: "total_marks", label: "Total Marks", pattern: /(?:total)[:\s]+(\d+)/i },
  ],
  income_certificate: [
    { key: "name", label: "Name" },
    { key: "income", label: "Annual Income", pattern: /(?:income|आय)[:\s]+(?:rs\.?|₹)?\s*([\d,]+)/i },
    { key: "certificate_number", label: "Certificate Number" },
  ],
  caste_certificate: [
    { key: "name", label: "Name" },
    { key: "caste", label: "Caste", pattern: /(?:caste|जाति)[:\s]+([A-Za-z\s]+)/i },
    { key: "certificate_number", label: "Certificate Number" },
  ],
  domicile_certificate: [
    { key: "name", label: "Name" },
    { key: "state", label: "State" },
    { key: "district", label: "District" },
    { key: "certificate_number", label: "Certificate Number" },
  ],
  bank_passbook: [
    { key: "account_holder", label: "Account Holder" },
    { key: "account_number", label: "Account Number (last 4)", pattern: /(\d{4})\s*$/, sensitive: true },
    { key: "bank_name", label: "Bank Name" },
    { key: "ifsc", label: "IFSC", pattern: /([A-Z]{4}0[A-Z0-9]{6})/i },
  ],
  electricity_bill: [
    { key: "consumer_name", label: "Consumer Name" },
    { key: "consumer_number", label: "Consumer Number" },
    { key: "address", label: "Address" },
    { key: "amount", label: "Amount Due", pattern: /(?:amount|due|₹|rs\.?)\s*([\d,]+)/i },
  ],
  other: [
    { key: "document_title", label: "Document Title" },
    { key: "reference_number", label: "Reference Number" },
    { key: "notes", label: "Notes" },
  ],
};

function extractWithPattern(text: string, pattern?: RegExp): string {
  if (!pattern) return "";
  const match = text.match(pattern);
  if (!match) return "";
  return (match[1] || match[0]).trim();
}

export function parseOcrLocally(input: OcrProcessInput): OcrProcessResult {
  const templates = FIELD_TEMPLATES[input.documentType] || FIELD_TEMPLATES.other;
  const text = input.rawText;

  const fields: OcrField[] = templates.map((t) => {
    let value = extractWithPattern(text, t.pattern);
    if (t.key === "aadhaar_last4" && value) {
      const full = text.match(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/);
      value = full ? extractAadhaarLast4(full[0]) : value;
    }
    const confidence = value ? 0.75 : 0;
    return {
      key: t.key,
      label: t.label,
      value,
      maskedValue: t.sensitive && value ? maskValue(t.key, value) : value,
      confidence,
      isSensitive: t.sensitive,
    };
  });

  const filled = fields.filter((f) => f.value);
  const overallConfidence = filled.length
    ? filled.reduce((s, f) => s + f.confidence, 0) / filled.length
    : 0;

  return { fields, overallConfidence, provider: "manual" };
}

export async function processOcrWithProvider(
  input: OcrProcessInput & { imageBase64?: string }
): Promise<OcrProcessResult> {
  const provider = input.provider;

  if (provider === "google_vision" && process.env.GOOGLE_VISION_API_KEY) {
    // Provider-ready: call Google Vision when key is configured
    try {
      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [{
              image: { content: input.imageBase64?.replace(/^data:[^;]+;base64,/, "") },
              features: [{ type: "TEXT_DETECTION" }],
            }],
          }),
        }
      );
      const data = await res.json();
      const rawText = data.responses?.[0]?.fullTextAnnotation?.text || input.rawText;
      return { ...parseOcrLocally({ ...input, rawText }), provider: "google_vision" };
    } catch {
      return parseOcrLocally(input);
    }
  }

  if (provider === "openai_vision" && process.env.OPENAI_API_KEY) {
    // Provider-ready: OpenAI vision when key configured
    return parseOcrLocally(input);
  }

  if (provider === "azure" && process.env.AZURE_OCR_ENDPOINT && process.env.AZURE_OCR_KEY) {
    return parseOcrLocally(input);
  }

  return parseOcrLocally(input);
}

export function mapOcrToCustomerFields(fields: OcrField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    if (!f.value) continue;
    if (f.key === "name" || f.key === "student_name" || f.key === "account_holder" || f.key === "consumer_name") {
      map.fullName = f.value;
    }
    if (f.key === "aadhaar_last4") map.aadhaarLast4 = f.value;
    if (f.key === "address") map.address = f.value;
    if (f.key === "dob") map.birthday = f.value;
  }
  return map;
}
