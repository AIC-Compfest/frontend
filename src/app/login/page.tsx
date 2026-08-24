"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { loginUser } from "@/lib/auth";
import VeriflowLogo from "@/components/logo/VeriflowLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ap.manager@enterprise.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Email atau password salah."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: string, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await loginUser(demoEmail, "password123");
      router.push(`/dashboard?role=${role}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal login dengan akun demo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between font-sans selection:bg-[#00B4B3]/20 selection:text-[#243A5E]">
      {/* Top Header / Nav */}
      <header className="w-full border-b border-[#CDDBE8] bg-white/90 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <VeriflowLogo />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#243A5E] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Centered Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 my-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div className="hidden lg:block px-8">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0077CC]">Reviewer workspace</span>
            <h1 className="font-display text-5xl leading-[1.05] text-[#12203A] mt-5">Make every charge easier to trust.</h1>
            <p className="text-base leading-relaxed text-[#55637A] max-w-md mt-6">Bring invoice review, shipment evidence, and contract logic into one calm workspace for your team.</p>
            <div className="grid grid-cols-3 gap-3 max-w-md mt-10">
              <div className="rounded-2xl bg-white border border-[#CDDBE8] p-4"><strong className="block text-xl text-[#243A5E]">01</strong><span className="text-xs text-[#7C879C]">Upload evidence</span></div>
              <div className="rounded-2xl bg-white border border-[#CDDBE8] p-4"><strong className="block text-xl text-[#243A5E]">02</strong><span className="text-xs text-[#7C879C]">Review variance</span></div>
              <div className="rounded-2xl bg-[#243A5E] p-4 text-white"><strong className="block text-xl">03</strong><span className="text-xs text-[#DCE8F5]">Decide with proof</span></div>
            </div>
          </div>
          <div className="w-full max-w-sm mx-auto space-y-4">
          <Card className="mx-auto border border-[#CDDBE8] shadow-[0_16px_48px_rgba(36,58,94,0.08)] bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-2 space-y-1">
              <CardTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Log in
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 pt-2 flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Demo Quick Access Badges */}
              <div className="p-2.5 rounded-xl bg-[#EDF4FA] border border-[#8FB8D6]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#243A5E] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#5F86A6]" />
                    Demo 1-Click Access:
                  </span>
                  <Badge variant="brand" className="text-[9px] px-1 py-0">
                    QUICK ACCESS
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("AP_MANAGER", "ap.manager@enterprise.com")}
                    className="p-1.5 rounded-md bg-white border border-[#8FB8D6]/60 text-left hover:border-[#243A5E] transition-all cursor-pointer text-[11px]"
                  >
                    <span className="font-bold text-[#243A5E] block leading-tight">AP Manager</span>
                    <span className="text-[9px] text-slate-400 block">Finance Reviewer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("FINANCE_CONTROLLER", "controller@enterprise.com")}
                    className="p-1.5 rounded-md bg-white border border-[#8FB8D6]/60 text-left hover:border-[#243A5E] transition-all cursor-pointer text-[11px]"
                  >
                    <span className="font-bold text-[#243A5E] block leading-tight">Controller</span>
                    <span className="text-[9px] text-slate-400 block">Finance Lead</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-[10px] text-slate-400">
                      Default: <code className="font-mono text-[#243A5E]">password123</code>
                    </span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#243A5E] text-white hover:bg-[#1C2E4A] font-bold text-xs h-10 mt-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>

              <div className="mt-2 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-slate-900 underline">
                  Sign up
                </Link>
                .
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      {/* Clean Subtle Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-white">
        © 2026 LogiRecon AI • COMPFEST 18 Smart Logistics
      </footer>
    </div>
  );
}
