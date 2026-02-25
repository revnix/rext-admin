"use client";

import { isAuthPage } from "@/lib/auth-routes";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { status } = useSession();
  const pathname = usePathname();

  const isOnboardingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_ORGANIC_ONBOARDING === "true";

  const { shouldShow, isLoading, isCompleted } = useOnboarding({
    enabled: isOnboardingEnabled,
  });
  const [isOpen, setIsOpen] = useState(false);

  const isExcludedPage = useMemo(
    () =>
      (pathname && isAuthPage(pathname)) || pathname?.startsWith("/onboarding"),
    [pathname],
  );

  useEffect(() => {
    if (!isOnboardingEnabled) {
      setIsOpen(false);
      return undefined;
    }

    if (status !== "authenticated" || isExcludedPage || isLoading) {
      setIsOpen(false);
      return undefined;
    }

    if (shouldShow && !isCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }

    setIsOpen(false);
    return undefined;
  }, [
    isOnboardingEnabled,
    status,
    isExcludedPage,
    isLoading,
    shouldShow,
    isCompleted,
  ]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {children}
      {isOnboardingEnabled && !isLoading && (
        <OnboardingModal open={isOpen} onClose={handleClose} />
      )}
    </>
  );
}
