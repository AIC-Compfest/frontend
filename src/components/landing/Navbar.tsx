"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  LogIn,
} from "lucide-react";
import VeriflowLogo from "../logo/VeriflowLogo";

interface NavbarProps {
  onLaunchApp?: () => void;
}

export function Navbar({ onLaunchApp }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <VeriflowLogo />
          {/* <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#243A5E] text-white shadow-xs group-hover:bg-[#1C2E4A] transition-all">
            <ShieldCheck className="h-5 w-5 text-[#8FB8D6]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#243A5E]">
                LogiRecon<span className="text-[#5F86A6]">.AI</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium -mt-0.5 hidden sm:inline">
              Evidence-First 3PL Reconciliation
            </span>
          </div> */}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="#features"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#243A5E] hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#243A5E] hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            How it Works
          </a>
          <a
            href="#benchmarks"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#243A5E] hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            Benchmark & Proof
          </a>
          <a
            href="#pricing"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#243A5E] hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#243A5E] hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-[#243A5E] font-semibold gap-1.5"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-[#243A5E] text-white hover:bg-[#1C2E4A] gap-1.5 shadow-sm group font-bold"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-2">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            How it Works
          </a>
          <a
            href="#benchmarks"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Benchmark & Proof
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            FAQ
          </a>
          <div className="pt-2 grid grid-cols-2 gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-[#243A5E] text-white justify-center text-xs">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
