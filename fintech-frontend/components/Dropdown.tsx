"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Dropdown() {
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

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

  return (
    <div className="dropdown dropdown-end">
      {/* Avatar trigger */}
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        {avatarImage ? (
          <div className="w-10 rounded-full">
            <img src={avatarImage} alt="User avatar" />
          </div>
        ) : (
          <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
            {avatarLetter}
          </div>
        )}
      </div>

      {/* Dropdown menu */}
      <ul
        tabIndex={-1}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
      >
        {!isLoggedIn ? (
          <>
            <li>
              <Link href="/login">Login</Link>
            </li>
            <li>
              <Link href="/signup">Sign up</Link>
            </li>
          </>
        ) : (
          <>
            <li className="menu-title">
              <span className="text-xs truncate">
                {session.user.email}
              </span>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="text-red-500"
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
