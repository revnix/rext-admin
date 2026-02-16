"use client";

import { isAuthPage } from "@/lib/auth-routes";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
// import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const { shouldShow, isLoading, isCompleted } = useOnboarding();
  const [_isOpen, setIsOpen] = useState(false);

  // Don't show onboarding on certain pages
  const isExcludedPage =
    (pathname && isAuthPage(pathname)) || pathname?.startsWith("/onboarding");

  useEffect(() => {
    // Only show onboarding for authenticated users
    if (status !== "authenticated") {
      setIsOpen(false);
      return undefined;
    }

    // Don't show on excluded pages
    if (isExcludedPage) {
      setIsOpen(false);
      return undefined;
    }

    // Don't show while loading
    if (isLoading) {
      return undefined;
    }

    // Show onboarding if needed and not already completed
    if (shouldShow && !isCompleted) {
      // Add a small delay to avoid jarring experience on page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }

    setIsOpen(false);
    return undefined;
  }, [status, shouldShow, isLoading, isCompleted, isExcludedPage]);

  // Onboarding modal disabled - using workspace wizard instead
  // const handleClose = () => {
  //   setIsOpen(false);
  // };

  return (
    <>
      {children}
      {/* Onboarding modal disabled - using workspace wizard instead */}
      {/* {!isLoading && <OnboardingModal open={isOpen} onClose={handleClose} />} */}
    </>
  );
}
