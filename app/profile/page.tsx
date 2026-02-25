"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Profile page redirect
 * This page has been consolidated with /settings
 * Redirects users to the unified account settings page
 */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          Redirecting to Account Settings...
        </p>
      </div>
    </div>
  );
}
