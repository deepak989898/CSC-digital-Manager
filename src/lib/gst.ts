import { InvoiceItem } from "@/types";

export interface GstCalcInput {
  quantity: number;
  rate: number;
  discount?: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  isInterState: boolean;
}

/** Rate is tax-exclusive (legacy) */
export function calculateLineItem(input: GstCalcInput): InvoiceItem {
  const discount = input.discount || 0;
  const taxableAmount = Math.max(0, input.quantity * input.rate - discount);
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (input.isInterState) {
    igstAmount = (taxableAmount * input.igstRate) / 100;
  } else {
    cgstAmount = (taxableAmount * input.cgstRate) / 100;
    sgstAmount = (taxableAmount * input.sgstRate) / 100;
  }

  const total = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  return {
    name: "",
    quantity: input.quantity,
    rate: input.rate,
    discount,
    taxableAmount,
    cgstRate: input.cgstRate,
    sgstRate: input.sgstRate,
    igstRate: input.igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total,
  };
}

export interface GstInclusiveInput {
  quantity: number;
  /** Per-unit price entered by user — includes tax when GST applies */
  inclusiveRate: number;
  discount?: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  isInterState: boolean;
  applyGst: boolean;
}

/** Rate entered by user is the final line total (tax inclusive) */
export function calculateLineItemInclusive(input: GstInclusiveInput): InvoiceItem {
  const discount = input.discount || 0;
  const lineTotal = Math.max(0, input.quantity * input.inclusiveRate - discount);

  if (!input.applyGst) {
    return {
      name: "",
      quantity: input.quantity,
      rate: input.inclusiveRate,
      discount,
      taxableAmount: lineTotal,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: lineTotal,
    };
  }

  let taxableAmount: number;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (input.isInterState) {
    const factor = 1 + input.igstRate / 100;
    taxableAmount = lineTotal / factor;
    igstAmount = lineTotal - taxableAmount;
  } else {
    const factor = 1 + (input.cgstRate + input.sgstRate) / 100;
    taxableAmount = lineTotal / factor;
    const totalTax = lineTotal - taxableAmount;
    cgstAmount = totalTax / 2;
    sgstAmount = totalTax / 2;
  }

  return {
    name: "",
    quantity: input.quantity,
    rate: input.inclusiveRate,
    discount,
    taxableAmount,
    cgstRate: input.cgstRate,
    sgstRate: input.sgstRate,
    igstRate: input.igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total: lineTotal,
  };
}

export function calculateInvoiceTotals(items: InvoiceItem[]) {
  const subtotal = items.reduce((s, i) => s + i.taxableAmount, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount, 0);
  const totalCgst = items.reduce((s, i) => s + i.cgstAmount, 0);
  const totalSgst = items.reduce((s, i) => s + i.sgstAmount, 0);
  const totalIgst = items.reduce((s, i) => s + i.igstAmount, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = items.reduce((s, i) => s + i.total, 0);
  return { subtotal, totalDiscount, totalCgst, totalSgst, totalIgst, totalTax, grandTotal };
}

export function isGstInvoiceType(invoiceType: string): boolean {
  return invoiceType === "gst" || invoiceType === "tax";
}

export function isInterState(shopState: string, customerState: string): boolean {
  if (!shopState || !customerState) return false;
  return shopState.toLowerCase().trim() !== customerState.toLowerCase().trim();
}

export function generateInvoiceNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  return `${prefix}/${year}/${String(count + 1).padStart(4, "0")}`;
}

export const INDIAN_STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "37", "Arunachal Pradesh": "12", Assam: "18", Bihar: "10",
  Chhattisgarh: "22", Goa: "30", Gujarat: "24", Haryana: "06", "Himachal Pradesh": "02",
  Jharkhand: "20", Karnataka: "29", Kerala: "32", "Madhya Pradesh": "23",
  Maharashtra: "27", Manipur: "14", Meghalaya: "17", Mizoram: "15", Nagaland: "13",
  Odisha: "21", Punjab: "03", Rajasthan: "08", Sikkim: "11", "Tamil Nadu": "33",
  Telangana: "36", Tripura: "16", "Uttar Pradesh": "09", Uttarakhand: "05",
  "West Bengal": "19", Delhi: "07", "Jammu and Kashmir": "01", Ladakh: "38",
};

export function getInvoiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    gst: "Tax Invoice (GST)",
    non_gst: "Receipt (Non-GST)",
    tax: "Tax Invoice",
    proforma: "Proforma Invoice",
    credit_note: "Credit Note",
  };
  return labels[type] || type;
}
