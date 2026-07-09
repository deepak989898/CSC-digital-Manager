"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Clock, Zap } from "lucide-react";

export default function ReminderSettingsPage() {
  return (
    <DashboardLayout title="Reminder Settings">
      <FeatureGate feature="smartReminders">
        <SettingsNav />
        <div className="max-w-2xl mx-auto space-y-4">
          <Card title="Smart Reminders">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Configure automation rules and manage reminders for payments, documents, invoices, and more.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/automation/rules"><Button variant="outline"><Zap className="h-4 w-4" /> Automation Rules</Button></Link>
              <Link href="/reminders"><Button><Clock className="h-4 w-4" /> View Reminders</Button></Link>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Email, SMS, and WhatsApp channels are provider-ready — configure SMTP and API keys in environment variables.
            </p>
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
