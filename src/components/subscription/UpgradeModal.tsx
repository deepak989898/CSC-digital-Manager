"use client";

import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string;
}

export function UpgradeModal({ isOpen, onClose, resource }: UpgradeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Limit Reached"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Link href="/subscription/plans">
            <Button onClick={onClose}>View Plans</Button>
          </Link>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-slate-700">
            You have reached your plan limit for <strong>{resource}</strong>.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Upgrade your subscription to add more {resource.toLowerCase()} and unlock premium features.
          </p>
        </div>
      </div>
    </Modal>
  );
}
