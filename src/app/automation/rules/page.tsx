"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { createDocument, updateDocument } from "@/lib/firebase/firestore";
import { AUTOMATION_TRIGGERS } from "@/lib/constants";
import { AutomationRule, AutomationTrigger } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AutomationRulesPage() {
  const { profile } = useAuth();
  const { data: rules, loading, refetch } = useShopCollection<AutomationRule>("automationRules");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "payment_pending" as AutomationTrigger,
    delayDays: "3",
    templateTitle: "",
    templateBody: "",
    priority: "medium" as AutomationRule["priority"],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const shopId = profile.shopId || profile.userId;
      await createDocument("automationRules", {
        name: form.name,
        trigger: form.trigger,
        delayDays: Number(form.delayDays) || 1,
        isActive: true,
        notifyInApp: true,
        notifyEmail: false,
        notifySms: false,
        notifyWhatsapp: false,
        templateTitle: form.templateTitle || form.name,
        templateBody: form.templateBody,
        priority: form.priority,
        userId: profile.userId,
        shopId,
      });
      toast.success("Rule created");
      setForm({ name: "", trigger: "payment_pending", delayDays: "3", templateTitle: "", templateBody: "", priority: "medium" });
      await refetch();
    } catch {
      toast.error("Failed to create rule");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: AutomationRule) => {
    try {
      await updateDocument("automationRules", rule.id, { isActive: !rule.isActive });
      toast.success(rule.isActive ? "Rule disabled" : "Rule enabled");
      await refetch();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <DashboardLayout title="Automation Rules">
      <FeatureGate feature="smartReminders">
        <div className="max-w-3xl mx-auto space-y-4">
          <SettingsNav />
          <Card title="New Automation Rule">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input label="Rule Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Select
                label="Trigger"
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value as AutomationTrigger })}
                options={AUTOMATION_TRIGGERS.map((t) => ({ value: t.value, label: t.label }))}
              />
              <Input label="Delay (days)" type="number" min="1" value={form.delayDays} onChange={(e) => setForm({ ...form, delayDays: e.target.value })} />
              <Input label="Reminder Title" value={form.templateTitle} onChange={(e) => setForm({ ...form, templateTitle: e.target.value })} />
              <Input label="Reminder Message" value={form.templateBody} onChange={(e) => setForm({ ...form, templateBody: e.target.value })} />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as AutomationRule["priority"] })}
                options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]}
              />
              <Button type="submit" loading={saving}><Plus className="h-4 w-4" /> Add Rule</Button>
            </form>
          </Card>
          <Card title="Active Rules">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : rules.length === 0 ? (
              <p className="text-sm text-slate-500">No rules yet</p>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-700">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.trigger.replace(/_/g, " ")} — after {r.delayDays} day(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={r.isActive ? "active" : "inactive"} />
                      <Button size="sm" variant="outline" onClick={() => toggleRule(r)}>
                        {r.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
