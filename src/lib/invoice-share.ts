import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const CANVAS_STYLE_PROPS = [
  "color",
  "background-color",
  "background-image",
  "border",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-width",
  "border-style",
  "border-radius",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "font-size",
  "font-weight",
  "font-family",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "display",
  "flex",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-self",
  "gap",
  "width",
  "height",
  "max-width",
  "max-height",
  "min-width",
  "min-height",
  "object-fit",
  "object-position",
  "opacity",
  "box-shadow",
  "overflow",
  "overflow-x",
  "overflow-y",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "transform",
  "white-space",
  "word-break",
  "vertical-align",
  "table-layout",
  "border-collapse",
] as const;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Copy browser-resolved RGB styles (avoids Tailwind oklch in html2canvas) */
function copyComputedStyles(source: Element, target: Element): void {
  if (!(source instanceof HTMLElement && target instanceof HTMLElement)) return;

  const computed = window.getComputedStyle(source);
  for (const prop of CANVAS_STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (!value || value === "none" || value === "normal") continue;
    if (value.includes("oklch(")) continue;
    target.style.setProperty(prop, value);
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) {
      copyComputedStyles(sourceChildren[i], targetChildren[i]);
    }
  }
}

function stripClasses(root: HTMLElement): void {
  root.removeAttribute("class");
  root.querySelectorAll("*").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.removeAttribute("class");
    }
  });
}

/**
 * Clone invoice into an isolated iframe with inline styles only.
 * html2canvas crashes on Tailwind v4 oklch() colors in the main document CSS.
 */
function createIsolatedClone(element: HTMLElement): {
  iframe: HTMLIFrameElement;
  clone: HTMLElement;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${Math.max(element.offsetWidth, 400)}px`;
  iframe.style.height = `${Math.max(element.offsetHeight, 600)}px`;
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create PDF preview frame");
  }

  doc.open();
  doc.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff;"></body></html>'
  );
  doc.close();

  const clone = element.cloneNode(true) as HTMLElement;
  copyComputedStyles(element, clone);
  stripClasses(clone);
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";
  clone.style.width = `${element.offsetWidth}px`;

  doc.body.appendChild(clone);

  return { iframe, clone };
}

function removeIframe(iframe: HTMLIFrameElement): void {
  if (iframe.parentNode) {
    iframe.parentNode.removeChild(iframe);
  }
}

/** Inline remote images so PDF capture works with Firebase Storage URLs */
async function inlineImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src);
        if (!response.ok) return;
        const blob = await response.blob();
        img.src = await blobToDataUrl(blob);
      } catch {
        // Image may still render in canvas if already painted on screen
      }
    })
  );
}

export async function generateInvoicePdf(element: HTMLElement): Promise<Blob> {
  await inlineImages(element);

  const { iframe, clone } = createIsolatedClone(element);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
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
  } finally {
    removeIframe(iframe);
  }
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
    grandTotal != null ? ` Amount: ₹${grandTotal.toLocaleString("en-IN")}.` : "";

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
