import { NextRequest, NextResponse } from "next/server";
import { processOcrWithProvider } from "@/lib/ocr";
import { OcrDocumentType, OcrProvider } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentType = (body.documentType || "other") as OcrDocumentType;
    const provider = (body.provider || "manual") as OcrProvider;
    const rawText = body.rawText || "";
    const imageBase64 = body.imageBase64 as string | undefined;
    const consentAccepted = body.consentAccepted === true;

    if (!consentAccepted) {
      return NextResponse.json(
        { error: "Customer consent is required before OCR processing" },
        { status: 400 }
      );
    }

    if (!rawText && !imageBase64) {
      return NextResponse.json(
        { error: "Provide rawText or imageBase64 for OCR" },
        { status: 400 }
      );
    }

    const result = await processOcrWithProvider({
      documentType,
      rawText: rawText || " ",
      provider,
      imageBase64,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OCR processing failed" },
      { status: 500 }
    );
  }
}
