"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { Facebook, Twitter, Linkedin, Instagram, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set timestamp to 30 days from now for demo purposes
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 15); // 15 days from now

    const calculateTimeLeft = () => {
      const difference = +targetDate - Date.now();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white font-sans text-slate-900 overflow-hidden selection:bg-blue-100">
      {/* 1. Grid Pattern Background - Same as 404 */}
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

      {/* Decorative pixels top right - Same as 404 */}
      <div className="absolute top-0 right-0 p-0 hidden md:block opacity-30">
        <div className="grid grid-cols-4 w-64 h-64">
          <div className="col-start-3 row-start-2 bg-slate-200" />
          <div className="col-start-4 row-start-1 bg-slate-100" />
          <div className="col-start-4 row-start-2 bg-slate-50" />
        </div>
      </div>

      {/* Decorative pixels bottom left - Same as 404 */}
      <div className="absolute bottom-0 left-0 p-0 hidden md:block opacity-30 rotate-180">
        <div className="grid grid-cols-4 w-64 h-64">
          <div className="col-start-3 row-start-2 bg-slate-200" />
          <div className="col-start-2 row-start-3 bg-slate-100" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-3xl px-6 w-full text-center">
        {/* Logo Section */}
        <div className="mb-8 md:mb-12">
          <BrandLogo width={180} height={50} variant="black" priority />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Coming Soon
        </h1>

        {/* Subtext */}
        <p className="text-slate-500 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          Our website is currently under construction, enter your email id to
          get latest updates and notifications about the website.
        </p>

        {/* Countdown Timer */}
        <div className="flex gap-4 md:gap-8 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-bold text-[#465FFF] tracking-tighter">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
          </div>

          <span className="text-4xl md:text-6xl text-[#465FFF] font-light -mt-2">
            :
          </span>

          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-bold text-[#465FFF] tracking-tighter">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
          </div>

          <span className="text-4xl md:text-6xl text-[#465FFF] font-light -mt-2">
            :
          </span>

          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-bold text-[#465FFF] tracking-tighter">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
          </div>

          <span className="text-4xl md:text-6xl text-[#465FFF] font-light -mt-2">
            :
          </span>

          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-bold text-[#465FFF] tracking-tighter">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Timer Subtext */}
        <div className="text-slate-400 font-medium text-sm md:text-base mb-16 uppercase tracking-widest">
          {timeLeft.days} days left
        </div>

        {/* Subscription Form */}
        <div className="w-full max-w-lg mb-8">
          <p className="text-slate-600 font-medium mb-4 text-sm md:text-base">
            Don't want to miss update? Subscribe now
          </p>
          <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
            <div className="relative flex-1">
              <Input
                placeholder="Email address"
                type="email"
                className="h-12 w-full bg-slate-50 border-slate-200 focus:border-[#465FFF] focus:ring-[#465FFF]"
              />
            </div>
            <Button className="h-12 px-6 bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold shrink-0 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="md:absolute bottom-8 mt-12 flex flex-col items-center gap-4">
        <span className="text-slate-400 font-medium text-sm">Follow Us On</span>
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="text-slate-400 hover:text-[#465FFF] transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </Link>
          <Link
            href="#"
            className="text-slate-400 hover:text-[#465FFF] transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </Link>
          <Link
            href="#"
            className="text-slate-400 hover:text-[#465FFF] transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </Link>
          <Link
            href="#"
            className="text-slate-400 hover:text-[#465FFF] transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
