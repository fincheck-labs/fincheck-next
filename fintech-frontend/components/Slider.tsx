"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { 
  User, 
  LogOut, 
  UploadCloud, 
  FileCheck, 
  Shield, 
  Hash, 
  DollarSign 
} from "lucide-react";

export default function DropdownFAB() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized handlers to prevent lag
  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  }, [router]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen) {
        const fab = document.querySelector('.fab');
        if (fab && !fab.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!mounted || isPending) return null;

  const isLoggedIn = !!session;
  const avatarLetter = isLoggedIn
    ? (session.user.name?.charAt(0) ?? "U").toUpperCase()
    : "G";
  const avatarImage = session?.user.image;

  const NavItem = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: any;
  }) => {
    const isActive = pathname === href;
    return (
      <li className="p-0">
        <Link
          href={href}
          onClick={closeMenu}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full justify-start group hover:shadow-md ${
            isActive
              ? 'bg-linear-to-r from-primary/15 to-secondary/15 border border-primary/30 shadow-md ring-2 ring-primary/20'
              : 'hover:bg-base-200/80 hover:-translate-x-1 hover:text-primary'
          }`}
        >
          <Icon className={`w-5 h-5 shrink-0 transition-all ${
            isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
          }`} />
          <span className={`font-semibold text-sm transition-colors ${
            isActive ? 'text-primary font-bold' : ''
          }`}>
            {label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="fixed bottom-8 right-8 z-999 lg:bottom-6 lg:right-6">
      <div className="fab fab-end">
        {/* FAB Button - Fixed responsiveness */}
        <button
          onClick={toggleMenu}
          className="btn btn-circle btn-lg btn-primary shadow-2xl hover:shadow-3xl active:scale-[0.95] transition-all duration-200 relative overflow-hidden group/fab"
          aria-expanded={isOpen}
          aria-label="Quick actions menu"
        >
          {avatarImage ? (
            <img
              src={avatarImage}
              alt="User avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-primary-content">
              {avatarLetter}
            </span>
          )}
        </button>

        {/* FAB Menu - Simplified reliable structure */}
        <ul 
          className={`menu menu-sm bg-base-100/98 backdrop-blur-xl shadow-2xl border border-base-200/40 rounded-2xl p-1 min-w-75 z-1000 transition-all duration-200 ease-out origin-bottom-right pointer-events-auto ${
            isOpen
              ? 'fab-open opacity-100 scale-100 translate-y-0 shadow-2xl'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
        >
          {!isLoggedIn ? (
            <>
              <NavItem href="/login" label="Sign In" icon={User} />
              <NavItem href="/signup" label="Create Account" icon={User} />
            </>
          ) : (
            <>
              {/* Profile Header */}
              <li className="p-3 border-b border-base-200/30 mb-2">
                <div className="flex items-center gap-3">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Profile" className="w-10 h-10 rounded-xl ring-2 ring-primary/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-bold text-sm ring-2 ring-primary/20">
                      {avatarLetter}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{session.user.name || 'User'}</p>
                    <p className="text-xs opacity-70 truncate">{session.user.email}</p>
                  </div>
                </div>
              </li>

              {/* Quick Actions */}
              <li className="menu-title font-semibold text-xs opacity-80 uppercase tracking-wide px-3 py-2 mb-1">
                Quick Actions
              </li>
              
              <NavItem href="/upload" label="Upload Image" icon={UploadCloud} />
              <NavItem href="/results" label="View Results" icon={FileCheck} />
              <NavItem href="/banking-demo" label="Digit Verification" icon={Shield} />
              <NavItem href="/digit-verify" label="Image Verification" icon={Hash} />
              <NavItem href="/cheque" label="Cheque Verfication" icon={DollarSign} />

              {/* Logout */}
              <li className="mt-3 pt-2 border-t border-base-200/30">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error/10 hover:text-error hover:shadow-md transition-all duration-200 group"
                >
                  <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                  <span className="font-semibold">Logout</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
