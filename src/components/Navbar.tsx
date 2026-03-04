"use client";

import { Zap, Github, ExternalLink } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-950 text-white shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-400/30">
            <Zap className="w-4 h-4 text-brand-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">
              EBA — Energy Baseline Analysis
            </h1>
            <p className="text-[10px] text-brand-300 font-medium">
              Building Genome Dataset &middot; ElasticNet Regression
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex badge badge-info text-[10px] bg-brand-800 text-brand-200 border border-brand-700">
            15 Meters &middot; 21 Features
          </span>
          <a
            href="/docs"
            target="_blank"
            className="p-2 rounded-lg hover:bg-brand-800 transition-colors"
            title="API Docs"
          >
            <ExternalLink className="w-4 h-4 text-brand-300" />
          </a>
        </div>
      </div>
    </header>
  );
}
