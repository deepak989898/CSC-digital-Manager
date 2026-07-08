"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Card } from "@/components/ui/Card";
import { AI_SUGGESTED_QUESTIONS } from "@/lib/constants";
import { Sparkles } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <DashboardLayout title="AI Assistant">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <AIAssistant />
        </div>
        <div className="space-y-4">
          <Card title="Suggested Questions">
            <div className="space-y-2">
              {AI_SUGGESTED_QUESTIONS.map((q) => (
                <p key={q} className="text-sm text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">{q}</p>
              ))}
            </div>
          </Card>
          <Card title="Capabilities">
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-orange" /> Real-time Firestore queries</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-orange" /> Earnings & payment insights</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-orange" /> Customer follow-up alerts</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-orange" /> OpenAI integration ready</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
