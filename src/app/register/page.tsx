"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { registerUser } from "@/lib/auth";
import VeriflowLogo from "@/components/logo/VeriflowLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("AP_MANAGER");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await registerUser({
        email,
        password,
        name: name || email.split("@")[0],
        company_name: companyName || "PT Enterprise Logistik",
        role,
      });
      router.push(`/dashboard?role=${role}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal melakukan registrasi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#E6EEF5] flex flex-col justify-between font-sans selection:bg-[#00B4B3]/20 selection:text-[#243A5E]">
      <div className="pointer-events-none absolute -left-48 bottom-0 h-[600px] w-[600px] bg-[url('/polygon-symmetric.svg')] bg-contain bg-no-repeat opacity-45" />
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
      <main className="relative z-10 flex min-h-[calc(100dvh-142px)] flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div className="hidden lg:block px-8">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0077CC]">A clearer operating rhythm</span>
            <h1 className="font-display text-5xl leading-[1.05] text-[#12203A] mt-5">A shared view of every exception.</h1>
            <p className="text-base leading-relaxed text-[#55637A] max-w-md mt-6">Set up a workspace where finance and operations teams can trace the decision from billed amount to source document.</p>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#55637A]"><span className="h-2 w-2 rounded-full bg-[#00B4B3]" />Built for evidence-led 3PL reconciliation.</div>
          </div>
          <div className="w-full max-w-sm mx-auto space-y-4">
          <Card className="mx-auto border border-white/80 shadow-[0_24px_70px_rgba(36,58,94,0.12)] bg-white/90 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <CardHeader className="p-8 pb-3 space-y-1">
              <CardTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Create an account
              </CardTitle>
            </CardHeader>

            <CardContent className="p-8 pt-2 flex flex-col gap-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Registration Form */}
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500">
                  Create a secure workspace for your finance and operations team.
                </p>

                <form onSubmit={handleSubmit} className="grid gap-3.5">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Budi Auditor"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="e.g. PT Agro Niaga"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Work Email</Label>
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
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="role">Auditor Role</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243A5E]"
                    >
                      <option value="AP_MANAGER">AP_MANAGER (Accounts Payable)</option>
                      <option value="FINANCE_CONTROLLER">FINANCE_CONTROLLER (Finance Lead)</option>
                      <option value="LOGISTICS_MANAGER">LOGISTICS_MANAGER (Operations)</option>
                      <option value="AUDITOR">AUDITOR (Independent Reviewer)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#243A5E] text-white hover:bg-[#1C2E4A] font-bold text-xs h-10 mt-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating an account...
                      </>
                    ) : (
                      "Create an account"
                    )}
                  </Button>
                </form>

                <div className="mt-2 text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-slate-900 underline">
                    Log in
                  </Link>
                  .
                </div>
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
