"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";

/**
 * Workspace root redirect.
 *
 * /w/<slug> has no index view of its own — the workspace dashboard lives at
 * `/` (the workspace switcher itself navigates there when no page segment is
 * active). Without this redirect the route rendered the app-wide 404 page
 * even though the workspace exists (verified at runtime, 2026-09-30).
 */
export default function WorkspaceRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/" as Route);
  }, [router]);

  return null;
}
