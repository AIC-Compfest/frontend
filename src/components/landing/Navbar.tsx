"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VeriflowLogo from "../logo/VeriflowLogo";

interface NavbarProps {
  onLaunchApp?: () => void;
  className?: string;
}

export function Navbar({ onLaunchApp, className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = [
    ["Features", "#features"],
    ["How it Works", "#how-it-works"],
    ["Benchmark & Proof", "#benchmarks"],
    ["FAQ", "#faq"],
  ];
  return (
    <header
      className={`${className} absolute left-0 right-0 top-0 z-50 px-4 pt-5 sm:px-8`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 shadow-[0_12px_38px_rgba(36,58,94,.08)] backdrop-blur-xl sm:px-7">
        <Link href="/" className="shrink-0">
          <VeriflowLogo className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#55637A] transition-colors hover:bg-[#E6EEF5] hover:text-[#243A5E]"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#243A5E] transition-colors hover:bg-[#E6EEF5]"
          >
            Sign In
          </Link>
          <Link href="/dashboard">
            <Button
              onClick={onLaunchApp}
              className="group h-11 rounded-full bg-[#243A5E] px-5 text-white hover:bg-[#174C84]"
            >
              Dashboard{" "}
              <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="rounded-full p-3 text-[#243A5E] hover:bg-[#E6EEF5] sm:hidden"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-[1440px] rounded-3xl border border-white/80 bg-white p-4 shadow-xl sm:hidden">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#243A5E] hover:bg-[#E6EEF5]"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full rounded-full">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full rounded-full bg-[#243A5E]">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
