"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops } from "@/lib/firebase/auth";
import { getShopDocuments, updateDocument } from "@/lib/firebase/firestore";
import { BrandingSettings, CustomDomain, Shop } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

export default function AdminWhiteLabelPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllShops().then((s) => {
      setShops(s);
      setLoading(false);
    });
  }, []);

  const approveDomain = async (domainId: string) => {
    try {
      await updateDocument("customDomains", domainId, {
        verificationStatus: "verified",
        verifiedAt: new Date().toISOString(),
      });
      toast.success("Domain marked as verified");
    } catch {
      toast.error("Failed to update");
    }
  };

  const resetBranding = async (brandingId: string) => {
    try {
      await updateDocument("brandingSettings", brandingId, { isEnabled: false });
      toast.success("Branding reset");
    } catch {
      toast.error("Failed to reset");
    }
  };

  return (
    <DashboardLayout title="White-Label Management">
      <div className="space-y-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          shops.map((shop) => (
            <ShopWhiteLabelCard key={shop.id} shop={shop} onApprove={approveDomain} onReset={resetBranding} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

function ShopWhiteLabelCard({
  shop,
  onApprove,
  onReset,
}: {
  shop: Shop;
  onApprove: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [domain, setDomain] = useState<CustomDomain | null>(null);

  useEffect(() => {
    (async () => {
      const b = await getShopDocuments<BrandingSettings>("brandingSettings", shop.id);
      const d = await getShopDocuments<CustomDomain>("customDomains", shop.id);
      setBranding(b[0] || null);
      setDomain(d[0] || null);
    })();
  }, [shop.id]);

  return (
    <Card title={shop.shopName}>
      <div className="text-sm space-y-2">
        <p>Owner: {shop.ownerName}</p>
        {branding ? (
          <div className="flex items-center justify-between">
            <span>Branding: {branding.brandName || "Custom"} — <Badge status={branding.isEnabled ? "active" : "inactive"} /></span>
            <Button size="sm" variant="outline" onClick={() => onReset(branding.id)}>Reset</Button>
          </div>
        ) : (
          <p className="text-slate-500">No custom branding</p>
        )}
        {domain ? (
          <div className="flex items-center justify-between">
            <span>Domain: {domain.domain} — <Badge status={domain.verificationStatus} /></span>
            {domain.verificationStatus === "pending" && (
              <Button size="sm" onClick={() => onApprove(domain.id)}>Approve</Button>
            )}
          </div>
        ) : (
          <p className="text-slate-500">No custom domain</p>
        )}
      </div>
    </Card>
  );
}
