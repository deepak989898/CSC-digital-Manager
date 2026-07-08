"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "@/lib/firebase/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="CSC Digital Manager"
              width={56}
              height={56}
              className="mx-auto rounded-xl mb-4"
            />
            <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
            <p className="text-sm text-slate-500 mt-1">
              {sent
                ? "Check your email for reset link"
                : "Enter your email to receive a reset link"}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
