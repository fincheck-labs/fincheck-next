"use client";

import Link from "next/link";
import ThemeController from "./ThemeController";
import Dropdown from "./Dropdown";
import Slider from "./Slider";
import ThemeToggle from "./ThemeController";

export default function Header() {
  return (
    <>
      <header className="w-full border-b border-base-300 bg-base-100">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-primary"
            >
              Fintech
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle/>
              {/* <Dropdown /> */}
            </div>

          </div>
        </div>
      </header>

      <div className="w-full border-b border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-6 py-2">
          <Slider />
        </div>
      </div>
    </>
  );
}
