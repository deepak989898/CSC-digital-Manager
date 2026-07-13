"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { createDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { checkImageQuality, compressImage } from "@/lib/offline-sync";
import { mapOcrToCustomerFields } from "@/lib/ocr";
import { AADHAAR_DISCLAIMER, OCR_CONSENT_TEXT } from "@/lib/masking";
import { OCR_DOCUMENT_TYPES } from "@/lib/constants";
import { Customer, OcrDocumentType, OcrField, OcrProvider } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { Camera, Upload, AlertTriangle } from "lucide-react";
import { logAudit } from "@/lib/audit";

function ScannerNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "";
  const { profile } = useAuth();
  const { data: customers } = useShopCollection<Customer>("customers");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [docType, setDocType] = useState<OcrDocumentType>("aadhaar");
  const [customerId, setCustomerId] = useState("");
  const [provider, setProvider] = useState<OcrProvider>("manual");
  const [consent, setConsent] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [fields, setFields] = useState<OcrField[]>([]);
  const [ocrDocId, setOcrDocId] = useState("");
  const [rawText, setRawText] = useState("");

  const handleFile = async (file: File) => {
    if (!profile || !consent || !disclaimer) {
      toast.error("Accept consent and disclaimer first");
      return;
    }
    setUploading(true);
    try {
      const warnings = await checkImageQuality(file);
      setQualityWarnings(warnings);
      const compressed = await compressImage(file);
      const shopId = profile.shopId || profile.userId;
      const path = getStoragePath(shopId, "documents", compressed.name);
      const { url, fileName } = await uploadFile(path, compressed);

      const customer = customers.find((c) => c.id === customerId);
      const docId = await createDocument("ocrDocuments", {
        customerId: customerId || undefined,
        customerName: customer?.fullName,
        applicationId: applicationId || undefined,
        documentType: docType,
        fileName,
        fileURL: url,
        fileSize: compressed.size,
        mimeType: compressed.type,
        provider,
        status: "processing",
        consentAccepted: true,
        disclaimerAccepted: true,
        uploadedByName: profile.displayName,
        userId: profile.userId,
        shopId,
      });
      setOcrDocId(docId);

      const textForOcr = rawText || `Document: ${docType}\nUploaded: ${fileName}`;
      const res = await fetch("/api/ocr/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          provider,
          rawText: textForOcr,
          consentAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");

      setFields(data.fields || []);
      setStep("review");
      toast.success("OCR extraction complete — please review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setUploading(false);
    }
  };

  const approveAndSave = async () => {
    if (!profile || !ocrDocId) return;
    setUploading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      await createDocument("ocrResults", {
        ocrDocumentId: ocrDocId,
        documentType: docType,
        fields,
        provider,
        overallConfidence: fields.length
          ? fields.reduce((s, f) => s + f.confidence, 0) / fields.length
          : 0,
        approved: true,
        approvedByName: profile.displayName,
        approvedAt: new Date().toISOString(),
        customerId: customerId || undefined,
        applicationId: applicationId || undefined,
        userId: profile.userId,
        shopId,
      });

      await logAudit({
        shopId,
        userId: profile.userId,
        userName: profile.displayName,
        userEmail: profile.email,
        action: "create",
        entity: "ocr",
        entityId: ocrDocId,
        entityName: docType,
        details: `OCR approved: ${fields.filter((f) => f.value).map((f) => f.key).join(", ")}`,
      });

      const customerFields = mapOcrToCustomerFields(fields);
      if (customerId && Object.keys(customerFields).length > 0) {
        toast.success("OCR saved. Use extracted data when editing customer.");
      } else {
        toast.success("OCR result saved");
      }
      setStep("done");
      router.push("/scanner");
    } catch {
      toast.error("Failed to save OCR result");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="Scan Document">
      <FeatureGate feature="ocr">
        <div className="max-w-3xl mx-auto space-y-4">
          {step === "upload" && (
            <Card title="Step 1: Upload & Scan">
              <div className="space-y-4">
                <Select
                  label="Document Type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as OcrDocumentType)}
                  options={OCR_DOCUMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
                <Select
                  label="Link Customer (optional)"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={customers.map((c) => ({ value: c.id, label: `${c.fullName} (${c.mobile})` }))}
                  placeholder="Select customer"
                />
                <Select
                  label="OCR Provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as OcrProvider)}
                  options={[
                    { value: "manual", label: "Manual / Local Parser" },
                    { value: "google_vision", label: "Google Vision (needs API key)" },
                    { value: "openai_vision", label: "OpenAI Vision (needs API key)" },
                    { value: "azure", label: "Azure OCR (needs API key)" },
                  ]}
                />
                <Input
                  label="Paste document text (optional — improves local OCR)"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste visible text from document..."
                />
                {docType === "aadhaar" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {AADHAAR_DISCLAIMER}
                  </div>
                )}
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                  {OCR_CONSENT_TEXT}
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={disclaimer} onChange={(e) => setDisclaimer(e.target.checked)} className="mt-1" />
                  I understand this system does not create or edit government documents.
                </label>
                {qualityWarnings.length > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800">
                    {qualityWarnings.map((w) => <p key={w}>⚠ {w}</p>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <input ref={fileRef} type="file" accept="*/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()} loading={uploading} disabled={!consent || !disclaimer}>
                    <Camera className="h-4 w-4" /> Camera
                  </Button>
                  <Button type="button" onClick={() => fileRef.current?.click()} loading={uploading} disabled={!consent || !disclaimer}>
                    <Upload className="h-4 w-4" /> Upload File
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === "review" && (
            <Card title="Step 2: Review Extracted Data">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Review and correct fields before saving. Auto-filled fields are highlighted.
              </p>
              <div className="space-y-3 mb-4">
                {fields.map((f, i) => (
                  <div key={f.key} className={`grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border ${f.value ? "border-brand-blue/30 bg-brand-light/30 dark:bg-brand-blue/10" : "border-slate-200 dark:border-slate-700"}`}>
                    <div>
                      <p className="text-xs text-slate-500">{f.label}</p>
                      <p className="text-xs text-slate-400">Confidence: {Math.round(f.confidence * 100)}%</p>
                    </div>
                    <Input
                      value={f.value}
                      onChange={(e) => {
                        const updated = [...fields];
                        updated[i] = { ...f, value: e.target.value, maskedValue: f.isSensitive ? undefined : e.target.value };
                        setFields(updated);
                      }}
                      placeholder={`Enter ${f.label}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={approveAndSave} loading={uploading}>Approve & Save</Button>
                <Button variant="outline" onClick={() => setStep("upload")}>Rescan</Button>
              </div>
            </Card>
          )}
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}

export default function ScannerNewPage() {
  return (
    <Suspense fallback={<DashboardLayout title="Scan Document"><TableSkeleton /></DashboardLayout>}>
      <ScannerNewContent />
    </Suspense>
  );
}
