"use client";

import { useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Reusable guard for actions that require a signed-in user (future
 * Like/Bookmark/Comment buttons, etc). Not wired to anything yet.
 *
 * Usage:
 *   const { requireAuth, promptOpen, redirectTo } = useRequireAuth(isAuthenticated);
 *   <button onClick={() => requireAuth(() => doTheProtectedThing())}>Like</button>
 *   {promptOpen && <SignInPrompt redirectTo={redirectTo} />}
 */
export function useRequireAuth(isAuthenticated: boolean) {
  const [promptOpen, setPromptOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
        return;
      }
      // Do not run the protected action — just surface the prompt.
      setPromptOpen(true);
    },
    [isAuthenticated]
  );

  return {
    requireAuth,
    promptOpen,
    closePrompt: () => setPromptOpen(false),
    redirectTo,
  };
}
