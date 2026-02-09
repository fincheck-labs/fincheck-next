"use client";

import { authClient } from "@/lib/auth-client";

export function UserInfo() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p>Loading...</p>;
  if (!session) return <p>Not logged in</p>;

  return <p>Welcome {session.user.email}</p>;
}
