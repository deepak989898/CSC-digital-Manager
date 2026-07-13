import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Inline remote images so PDF capture works with Firebase Storage URLs */
async function inlineImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src, { mode: "cors" });
        if (!response.ok) return;
        const blob = await response.blob();
        img.src = await blobToDataUrl(blob);
      } catch {
        // Keep original src; html2canvas may still render if already loaded
      }
    })
  );
}

export async function generateInvoicePdf(element: HTMLElement): Promise<Blob> {
  await inlineImages(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let imgWidth = maxWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", x, margin, imgWidth, imgHeight);

  return pdf.output("blob");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function normalizeWhatsAppPhone(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits;
}

export interface ShareInvoiceOptions {
  element: HTMLElement;
  invoiceNumber: string;
  customerName: string;
  customerMobile?: string;
  grandTotal?: number;
}

export type ShareInvoiceResult = "shared" | "whatsapp" | "downloaded" | "cancelled";

export async function shareInvoiceOnWhatsApp(options: ShareInvoiceOptions): Promise<ShareInvoiceResult> {
  const { element, invoiceNumber, customerName, customerMobile, grandTotal } = options;
  const safeNumber = invoiceNumber.replace(/\//g, "-");
  const fileName = `Invoice-${safeNumber}.pdf`;

  const totalText =
    grandTotal != null
      ? ` Amount: ₹${grandTotal.toLocaleString("en-IN")}.`
      : "";

  const message = `Hello ${customerName},\n\nPlease find your invoice *${invoiceNumber}*.${totalText}\n\nThank you!`;

  const pdfBlob = await generateInvoicePdf(element);
  const file = new File([pdfBlob], fileName, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;
      if (canShareFiles) {
        await navigator.share({
          files: [file],
          text: message,
          title: `Invoice ${invoiceNumber}`,
        });
        return "shared";
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  downloadBlob(pdfBlob, fileName);

  const phone = customerMobile ? normalizeWhatsAppPhone(customerMobile) : "";
  const attachNote = "\n\n📎 PDF downloaded — please attach it in this chat.";
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message + attachNote)}`
    : `https://wa.me/?text=${encodeURIComponent(message + attachNote)}`;

  window.open(waUrl, "_blank", "noopener,noreferrer");
  return "whatsapp";
}
