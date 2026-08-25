"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Landing Page Components (Styled after SaaS Kit / Shadcn Design System)
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogosCloud } from "@/components/landing/LogosCloud";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InteractiveSimulator } from "@/components/landing/InteractiveSimulator";
import { BenchmarkMetrics } from "@/components/landing/BenchmarkMetrics";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const router = useRouter();

  const handleLaunchDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F9FB] text-[#12203A] flex flex-col font-sans selection:bg-[#00B4B3]/20 selection:text-[#243A5E]">
      {/* Top Sticky Navbar with Sign In & Go to Dashboard Buttons */}
      <Navbar 
        onLaunchApp={handleLaunchDashboard} 
        // make it sticky at the top of the page with a shadow and a semi-transparent background
        className="fixed"
      />

      {/* Hero Section with Interactive Mockup */}
      <HeroSection onLaunchApp={handleLaunchDashboard} />

      {/* 3PL & ERP Logos Cloud */}
      <LogosCloud />

      {/* 4 Pillars Features Section */}
      <FeaturesSection />

      {/* How It Works 4-Step Pipeline Flow */}
      <HowItWorks />

      {/* Interactive Live Scenario Simulator */}
      <InteractiveSimulator onLaunchApp={handleLaunchDashboard} />

      {/* Competition Verified Benchmark Metrics */}
      <BenchmarkMetrics />

      {/* Transparent SaaS Pricing Plans */}
      {/* <PricingSection onLaunchApp={handleLaunchDashboard} /> */}

      {/* Frequently Asked Questions */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
