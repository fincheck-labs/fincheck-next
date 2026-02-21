"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeController";
import Slider from "./Slider";

export default function Header() {
  return (
    <>
      <header className="w-full border-b border-base-300 bg-base-100">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">

            {/* Branding */}
            <Link href="/" className="group">
              <div className="flex flex-col leading-tight">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                  Fintech
                </span>
                <span className="text-sm md:text-base opacity-70 group-hover:opacity-90 transition-opacity">
                  Confidence-Aware Cheque Digit Validation System
                </span>
              </div>
            </Link>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>

          </div>
        </div>
      </header>

      {/* Slider Section */}
      <div className="w-full border-b border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-6 py-2">
          <Slider />
        </div>
      </div>
    </>
  );
}