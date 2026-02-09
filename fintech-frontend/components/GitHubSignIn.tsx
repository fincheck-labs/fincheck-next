"use client";

import { authClient } from "@/lib/auth-client";

export default function GitHubSignIn() {
  const signIn = async () => {
    await authClient.signIn.social({
      provider: "github",
    });
  };

  return (
    <button
      onClick={signIn}
      className="btn btn-primary"
    >
      Sign In with GitHub
    </button>
  );
}
