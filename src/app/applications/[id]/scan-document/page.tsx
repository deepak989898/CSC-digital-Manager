"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ApplicationScanDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/scanner/new?applicationId=${id}`);
  }, [id, router]);

  return (
    <DashboardLayout title="Scan Document">
      <TableSkeleton />
    </DashboardLayout>
  );
}
