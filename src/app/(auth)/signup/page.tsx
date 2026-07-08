"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";

function getSignupErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in or use Forgot Password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your internet and try again.";
      default:
        return "Signup failed. Please try again.";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "Signup failed. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(form.email, form.password, form.displayName);
      toast.success("Account created successfully");
      router.push("/settings/profile");
    } catch (err: unknown) {
      toast.error(getSignupErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Account created successfully");
      router.push("/settings/profile");
    } catch (err: unknown) {
      toast.error(getSignupErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="CSC Digital Manager"
                width={72}
                height={72}
                className="mx-auto rounded-xl mb-4"
              />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Register your CSC shop</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Owner Name"
              value={form.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              placeholder="Your full name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Min 6 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Confirm password"
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-500">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignup} loading={loading}>
            Sign up with Google
          </Button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-blue font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
