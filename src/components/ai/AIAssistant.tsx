"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { processAIQuery } from "@/lib/ai-assistant";
import { createDocument, updateDocument } from "@/lib/firebase/firestore";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { AiChat, AiChatMessage } from "@/types";
import { AI_SUGGESTED_QUESTIONS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Bot, Send, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  compact?: boolean;
}

export function AIAssistant({ compact = false }: AIAssistantProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll the chat panel itself — never the page (scrollIntoView scrolls the window)
    if (messages.length === 0) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !profile?.shopId || loading) return;

    const userMsg: AiChatMessage = { role: "user", content: text.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await processAIQuery(profile.shopId, text);
      const assistantMsg: AiChatMessage = {
        role: "assistant",
        content: result.answer,
        timestamp: new Date().toISOString(),
      };
      const updated = [...messages, userMsg, assistantMsg];
      setMessages(updated);

      if (chatId) {
        await updateDocument("aiChats", chatId, { messages: updated, title: text.slice(0, 50) });
      } else {
        const id = await createDocument("aiChats", {
          title: text.slice(0, 50),
          messages: updated,
          userId: profile.userId,
          shopId: profile.shopId,
        });
        setChatId(id);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", compact ? "h-[500px]" : "h-[min(640px,calc(100vh-11rem))]")}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-brand-blue/10 rounded-lg">
          <Bot className="h-5 w-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Business Assistant</h3>
          <p className="text-xs text-slate-500">Ask about your shop data</p>
        </div>
        <Sparkles className="h-4 w-4 text-brand-orange ml-auto" />
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 text-center">Ask me anything about your business</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {AI_SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                <button key={q} onClick={() => sendMessage(q)} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-brand-blue/10 hover:text-brand-blue transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-sm", msg.role === "user" ? "bg-brand-blue text-white rounded-br-md" : "bg-slate-100 dark:bg-slate-700 rounded-bl-md")}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-brand-blue rounded-lg" title="Voice input (ready)">
            <Mic className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-brand-blue"
          />
          <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
