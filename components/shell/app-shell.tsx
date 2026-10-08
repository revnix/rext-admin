"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { BackgroundGenerationDock } from "@/components/background-generation-dock";
import { ShellBillingBanner } from "@/components/billing/billing-action-notice";
import { ImpersonationBanner } from "@/components/impersonation/impersonation-banner";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { FirstLoginQuestions } from "@/components/onboarding/first-login-questions";
import { AnalyticsConsentPrompt } from "@/components/privacy/analytics-consent-prompt";
import {
  type SidebarPreference,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { useNotificationStore } from "@/stores/notification-store";
import { useWorkspaceStore } from "@/stores/workspace";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { IncidentBanner } from "./incident-banner";
import { MobileBottomBar } from "./mobile-bottom-bar";
import { useGenerateShortcut } from "./use-generate-shortcut";
import { useShellNavigation } from "./use-shell-navigation";

/**
 * Keeps the session watch of useAuthSession (it signs out on a refresh error that is not
 * stale) in a leaf of its own: the hook re-renders on every click, key and scroll.
 */
function SessionWatch() {
  useAuthSession();
  return null;
}

function Notifications() {
  const isDrawerOpen = useNotificationStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useNotificationStore((state) => state.setDrawerOpen);
  return (
    <NotificationsDrawer
      open={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
    />
  );
}

/**
 * The frame every signed-in page sits in (design/app-language.md §5), mounted once by the route
 * layouts so it stays put while pages change: the sidebar (a sheet with a bottom bar under
 * 1024 px), the header, a failed renewal's banner, the page in `main`, and the
 * background-generation dock.
 */
export function AppShell({
  defaultPreference,
  rememberSidebar = true,
  children,
}: {
  defaultPreference: SidebarPreference;
  /** False for an area with a sidebar state of its own (the article editor): nothing is saved from it. */
  rememberSidebar?: boolean;
  children: ReactNode;
}) {
  const navigation = useShellNavigation();
  useGenerateShortcut(navigation.generate?.url ?? null);

  // The workspace items are filtered by permissions that live in memory. WorkspaceProvider loads
  // them on /w/<slug> pages; this loads them everywhere else, keyed by slug as the provider does,
  // so the two share one request.
  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>();
  const currentSlug = useWorkspaceStore(
    (state) => state.currentWorkspace?.slug,
  );
  useWorkspacePermissions(workspaceSlug ?? currentSlug);

  return (
    <SidebarProvider
      defaultPreference={defaultPreference}
      remember={rememberSidebar}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:rounded-sm focus:bg-surface-raised focus:px-3 focus:py-2 focus:text-label focus:shadow-overlay"
      >
        Skip to content
      </a>
      <AppSidebar navigation={navigation} />
      <SidebarInset className="pb-(--bottom-bar-height) lg:pb-0">
        <AppHeader />
        <ImpersonationBanner />
        {/* While something is failing for everyone (a super admin's switch); nothing otherwise. */}
        <IncidentBanner />
        <ShellBillingBanner />
        {/* Asked once, where the law asks for it; a band like the one above, so it covers nothing. */}
        <AnalyticsConsentPrompt />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col outline-none"
        >
          {children}
        </main>
        <BackgroundGenerationDock />
        {/* Asked once, at the first login of an organic sign-up (the backend decides). */}
        <FirstLoginQuestions />
      </SidebarInset>
      <MobileBottomBar navigation={navigation} />
      <Notifications />
      <SessionWatch />
    </SidebarProvider>
  );
}
