import React from "react";
import { Truck, Database, Building2, PackageCheck, Network, ShieldCheck } from "lucide-react";

export function LogosCloud() {
  const vendors = [
    { name: "PT Cepat Logistik Nusantara", tag: "Express 3PL" },
    { name: "PT Trans Express Indonesia", tag: "Linehaul Freight" },
    { name: "PT Kargo Andalan Utama", tag: "Heavy Cargo" },
    { name: "PT Sinar Logistik Mandiri", tag: "Regional 3PL" },
    { name: "PT Aruna Freight Solusi", tag: "Intercity Fleet" },
  ];

  const erps = [
    "SAP S/4HANA",
    "Oracle SCM Cloud",
    "Microsoft Dynamics 365",
    "Odoo ERP",
    "Connected data sources",
  ];

  return (
    <section className="border-y border-slate-200/80 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5F86A6]">
            Universal Multi-Vendor 3PL Compatibility
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#243A5E]">
            Reconciles Any 3PL Format with Zero Custom Vendor Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Our AI layout understanding handles unstandardized invoices, handwritten PODs, and custom rate tables seamlessly.
          </p>
        </div>

        {/* Vendor Grid Chips */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          {vendors.map((v, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center hover:bg-[#EDF4FA] hover:border-[#8FB8D6]/60 transition-colors group cursor-default"
            >
              <Truck className="h-5 w-5 text-[#5F86A6] mb-1.5 group-hover:text-[#243A5E] transition-colors" />
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {v.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {v.tag}
              </span>
            </div>
          ))}
        </div>

        {/* Enterprise Integration Badges */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#243A5E]" />
            Enterprise ERP Ready:
          </span>
          {erps.map((erp, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{erp}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
