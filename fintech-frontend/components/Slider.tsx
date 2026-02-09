"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";

export default function DropdownFAB() {
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  };

  if (!mounted || isPending) return null;

  const isLoggedIn = !!session;
  const avatarLetter = isLoggedIn
    ? (session.user.name?.charAt(0) ?? "U").toUpperCase()
    : "F";

  const avatarImage = session?.user.image;

  const NavItem = ({
    href,
    label,
    variant = "outline",
  }: {
    href: string;
    label: string;
    variant?: string;
  }) => {
    const isActive = pathname === href;

    if (isActive) {
      return (
       <button
  disabled
  className="
    btn btn-sm btn-soft btn-secondary
    justify-start cursor-default
    ring-1 ring-secondary/30
    bg-secondary/10
    text-secondary
  "
>
  {label}
</button>

      );
    }

    return (
      <Link
        href={href}
        className={`btn btn-sm btn-${variant} justify-start`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="fab fab-end gap-2">
        {/* ===== FAB Trigger ===== */}
        <div
          tabIndex={0}
          role="button"
          aria-label="Quick actions"
          className="btn btn-circle btn-lg btn-primary shadow-lg avatar"
        >
          {avatarImage ? (
            <img
              src={avatarImage}
              alt="User avatar"
              className="w-full rounded-full"
            />
          ) : (
            <span className="text-lg font-semibold text-primary-content">
              {avatarLetter}
            </span>
          )}
        </div>

        {/* ===== FAB Actions ===== */}
        <ul className="menu menu-sm gap-2 bg-base-100 rounded-box shadow-lg p-3">
          {!isLoggedIn ? (
            <>
              <NavItem href="/login" label="Login" />
              <NavItem href="/signup" label="Sign up" />
            </>
          ) : (
            <>
              <li className="menu-title">
                <span className="text-xs truncate opacity-70">
                  {session.user.email}
                </span>
              </li>

              {/* ===== MAIN NAV ===== */}
              <NavItem href="/upload" label="Upload Image" />
              <NavItem href="/results" label="Results" />
              <NavItem href="/banking-demo" label="Verify Image" variant="info" />
              <NavItem href="/digit-verify" label="Digit Verify" variant="success" />
              <NavItem href="/cheque" label="Cheque Verify" variant="cheque-success"/>

              <div className="divider my-1" />

              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-error justify-start"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
