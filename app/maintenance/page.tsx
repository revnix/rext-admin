"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans text-slate-900 overflow-hidden selection:bg-blue-100">
      {/* 1. Grid Pattern Background - Consistent across error/status pages */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(circle at center, black 40%, transparent 100%)",
        }}
      />

      {/* Decorative pixels top right */}
      <div className="absolute top-0 right-0 p-0 hidden md:block opacity-30">
        <div className="grid grid-cols-4 w-64 h-64">
          <div className="col-start-3 row-start-2 bg-slate-200" />
          <div className="col-start-4 row-start-1 bg-slate-100" />
          <div className="col-start-4 row-start-2 bg-slate-50" />
        </div>
      </div>

      {/* Decorative pixels bottom left */}
      <div className="absolute bottom-0 left-0 p-0 hidden md:block opacity-30 rotate-180">
        <div className="grid grid-cols-4 w-64 h-64">
          <div className="col-start-3 row-start-2 bg-slate-200" />
          <div className="col-start-2 row-start-3 bg-slate-100" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-4 text-center">
        {/* Maintenance Gears Graphic */}
        <div className="mb-8 relative w-48 h-48 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#465FFF]"
            role="img"
            aria-label="Maintenance gears"
          >
            {/* Large Gear (Bottom/Center) */}
            <g className="origin-[85px_115px] animate-[spin_10s_linear_infinite]">
              <circle cx="85" cy="115" r="40" fill="currentColor" />
              {/* Gear Teeth - Simplified for visual style */}
              {[...Array(8)].map((_, i) => (
                <rect
                  key={`lg-tooth-${String(i)}`}
                  x="77"
                  y="60"
                  width="16"
                  height="16"
                  fill="currentColor"
                  transform={`rotate(${i * 45} 85 115)`}
                />
              ))}
              <circle cx="85" cy="115" r="16" fill="white" />
            </g>

            {/* Medium Gear (Top Right) */}
            <g className="origin-[145px_75px] animate-[spin_8s_linear_infinite_reverse]">
              <circle cx="145" cy="75" r="28" fill="currentColor" />
              {[...Array(8)].map((_, i) => (
                <rect
                  key={`md-tooth-${String(i)}`}
                  x="139"
                  y="38"
                  width="12"
                  height="12"
                  fill="currentColor"
                  transform={`rotate(${i * 45} 145 75)`}
                />
              ))}
              <circle cx="145" cy="75" r="10" fill="white" />
            </g>

            {/* Small Gear (Far Right/Floating) */}
            <g className="origin-[175px_110px] animate-[spin_6s_linear_infinite]">
              <circle cx="175" cy="110" r="16" fill="currentColor" />
              {[...Array(6)].map((_, i) => (
                <rect
                  key={`sm-tooth-${String(i)}`}
                  x="171"
                  y="88"
                  width="8"
                  height="8"
                  fill="currentColor"
                  transform={`rotate(${i * 60} 175 110)`}
                />
              ))}
              <circle cx="175" cy="110" r="6" fill="white" />
            </g>
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mb-6 uppercase tracking-tight">
          Maintenance
        </h1>

        {/* Subtext */}
        <p className="text-slate-500 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-medium">
          Our Site is Currently under maintenance We will be back Shortly
          <br className="hidden md:block" />
          Thank You For Patience
        </p>

        {/* Action Button */}
        <Button
          asChild
          className="h-12 px-8 rounded-xl bg-[#465FFF] text-white font-semibold hover:bg-[#3641F5] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <Link href="/">Back to Home Page</Link>
        </Button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-sm text-slate-400 font-medium">
        &copy; 2026 - Rext AI Admin
      </div>
    </div>
  );
}
