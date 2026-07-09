"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { CustomDomain } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

const DNS_INSTRUCTIONS = `Add these DNS records at your domain registrar:
1. CNAME: www → cname.vercel-dns.com
2. A record: @ → 76.76.21.21
Then add the domain in Vercel project settings → Domains.`;

export default function DomainSettingsPage() {
  const { profile } = useAuth();
  const [domain, setDomain] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState<CustomDomain["verificationStatus"]>("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.shopId) return;
    (async () => {
      const list = await getShopDocuments<CustomDomain>("customDomains", profile.shopId);
      if (list[0]) {
        setRecordId(list[0].id);
        setDomain(list[0].domain);
        setStatus(list[0].verificationStatus);
      }
    })();
  }, [profile?.shopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !domain) return;
    setSaving(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const data = {
        domain,
        verificationStatus: "pending" as const,
        dnsRecords: DNS_INSTRUCTIONS,
        userId: profile.userId,
        shopId,
      };
      if (recordId) {
        await updateDocument("customDomains", recordId, data);
      } else {
        const id = await createDocument("customDomains", data);
        setRecordId(id);
      }
      setStatus("pending");
      toast.success("Domain saved — complete DNS setup in Vercel");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Custom Domain">
      <FeatureGate feature="whiteLabel">
        <SettingsNav />
        <div className="max-w-2xl mx-auto space-y-4">
          <Card title="Custom Domain">
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Your Domain" placeholder="shop.example.com" value={domain} onChange={(e) => setDomain(e.target.value)} required />
              {domain && <Badge status={status} />}
              <Button type="submit" loading={saving}>Save Domain</Button>
            </form>
          </Card>
          <Card title="DNS Instructions">
            <pre className="text-xs whitespace-pre-wrap text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              {DNS_INSTRUCTIONS}
            </pre>
            <p className="text-xs text-slate-500 mt-2">Super Admin can approve domain verification from Admin → White-Label.</p>
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
