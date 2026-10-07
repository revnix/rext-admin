"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { UnsubscribeCard } from "@/components/auth/unsubscribe-card";

function UnsubscribeContent() {
  return <UnsubscribeCard token={useSearchParams().get("token")} />;
}

/**
 * Every email's unsubscribe link opens here, signed in or not (proxy.ts lists it as public).
 */
export default function UnsubscribePage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <UnsubscribeContent />
      </Suspense>
    </AuthLayout>
  );
}
