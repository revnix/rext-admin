"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (

    <html lang="en">
      <body>
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans text-slate-900 overflow-hidden selection:bg-blue-100">
          {/* 1. Grid Pattern Background */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
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
            {/* ERROR Label */}
            <h2 className="text-[2.5rem] font-extrabold tracking-tight text-[#1e293b] mb-2 uppercase">
              Error
            </h2>

            {/* 500 Graphic */}
            <div className="flex items-center justify-center gap-4 md:gap-6 my-6 md:my-10 scale-90 md:scale-100">
              
              {/* Number 5 (Left) */}
              <svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#465FFF]">
                {/* Top Bar */}
                <rect x="0" y="25" width="100" height="30" fill="currentColor"/>
                {/* Left Upper Stem */}
                <rect x="0" y="25" width="30" height="60" fill="currentColor"/>
                {/* Mid Bar */}
                <rect x="0" y="70" width="100" height="30" fill="currentColor"/>
                {/* Right Lower Stem */}
                <rect x="70" y="70" width="30" height="60" fill="currentColor"/>
                {/* Bottom Bar */}
                <rect x="0" y="120" width="100" height="30" fill="currentColor"/>
              </svg>

               {/* Number 0 (Middle - Face) */}
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#465FFF]">
                 <rect width="140" height="140" rx="35" fill="currentColor"/>
                 {/* Eyes */}
                 <rect x="35" y="45" width="22" height="22" rx="4" fill="white"/>
                 <rect x="83" y="45" width="22" height="22" rx="4" fill="white"/>
                 {/* Sad Mouth - Arc */}
                 <path d="M40 105 C40 105 55 90 70 90 C85 90 100 105 100 105" stroke="white" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              {/* Number 3 (Right) */}
              <svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#465FFF]">
                {/* Top Bar */}
                <rect x="0" y="25" width="100" height="30" fill="currentColor"/>
                {/* Right Upper Stem */}
                <rect x="70" y="25" width="30" height="60" fill="currentColor"/>
                {/* Mid Bar */}
                <rect x="0" y="70" width="100" height="30" fill="currentColor"/>
                {/* Right Lower Stem */}
                <rect x="70" y="70" width="30" height="60" fill="currentColor"/>
                {/* Bottom Bar */}
                <rect x="0" y="120" width="100" height="30" fill="currentColor"/>
              </svg>
            </div>

            {/* Message */}
            <p className="mb-10 text-lg md:text-xl text-slate-500 font-medium">
              We can't seem to find the page you are looking for!
            </p>

            {/* CTA Button */}
            <div className="flex gap-4">
                 <Button 
                    asChild 
                    variant="outline" 
                    className="h-12 px-8 rounded-xl border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                >
                  <Link href="/">Back to Home Page</Link>
                </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 text-sm text-slate-400 font-medium">
            &copy; 2026 - Rext Admin
          </div>
        </div>
      </body>
    </html>
  );
}
