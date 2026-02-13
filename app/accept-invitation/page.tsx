"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";

/**
 * Invitation Acceptance Page
 *
 * This page is shown after an existing user logs in with an invitation token.
 * It automatically accepts the invitation and adds the user to the workspace.
 *
 * Flow:
 * 1. User clicks invitation link → Redirects to /login?token=xyz
 * 2. User logs in → Redirects to /accept-invitation?token=xyz
 * 3. This page auto-accepts invitation → Redirects to workspace
 */
export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token from URL or sessionStorage
  const tokenFromUrl = searchParams.get("token");
  const [invitationToken] = useState(() => {
    return tokenFromUrl || sessionStorage.getItem("pending_invitation_token");
  });

  // Validate invitation
  const {
    invitation,
    isLoading: isValidating,
    isValid: hasValidInvitation,
    error: validationError,
  } = useInvitationValidation();

  const acceptInvitation = useCallback(async () => {
    if (!invitationToken) {
      setError("No invitation token found");
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/invitations/${invitationToken}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "Failed to accept invitation",
        );
      }

      const data = await response.json();
      setAccepted(true);

      // Clean up session storage
      sessionStorage.removeItem("pending_invitation_token");

      // Redirect to workspace after short delay
      setTimeout(() => {
        if (data.data?.workspace?.slug) {
          router.push(`/w/${data.data.workspace.slug}`);
        } else {
          router.push("/");
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation",
      );
    } finally {
      setIsAccepting(false);
    }
  }, [invitationToken, router, session?.user?.accessToken]);

  // Auto-accept invitation when user is authenticated and invitation is valid
  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      hasValidInvitation &&
      invitationToken &&
      !isAccepting &&
      !accepted &&
      !error
    ) {
      acceptInvitation();
    }
  }, [
    sessionStatus,
    hasValidInvitation,
    invitationToken,
    isAccepting,
    accepted,
    error,
    acceptInvitation,
  ]);

  // Redirect to login if not authenticated
  if (sessionStatus === "unauthenticated") {
    router.push(`/login${invitationToken ? `?token=${invitationToken}` : ""}`);
    return null;
  }

  // Loading state
  if (sessionStatus === "loading" || isValidating) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (validationError || error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invitation Error</CardTitle>
            </div>
            <CardDescription>Unable to accept invitation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error || validationError || "An unexpected error occurred"}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/workspaces")}
              >
                View My Workspaces
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Invitation Accepted!</CardTitle>
            </div>
            <CardDescription>
              You've successfully joined{" "}
              {invitation?.workspace.name || "the workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              <p className="font-medium">Welcome to the team!</p>
              <p className="text-sm mt-1">
                Redirecting you to the workspace...
              </p>
            </div>

            {invitation && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Workspace:</span>{" "}
                  {invitation.workspace.name}
                </p>
                <p>
                  <span className="font-medium">Your role:</span>{" "}
                  {invitation.role.display_name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepting state
  if (isAccepting) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <CardTitle>Accepting Invitation...</CardTitle>
            </div>
            <CardDescription>
              Please wait while we add you to{" "}
              {invitation?.workspace.name || "the workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Show invitation details (shouldn't normally be seen due to auto-accept)
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Workspace</CardTitle>
          <CardDescription>
            Accept your invitation to join{" "}
            {invitation?.workspace.name || "the workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2 text-sm">
              <p>
                <span className="font-medium">Workspace:</span>{" "}
                {invitation.workspace.name}
              </p>
              <p>
                <span className="font-medium">Invited by:</span>{" "}
                {invitation.invited_by.first_name}{" "}
                {invitation.invited_by.last_name}
              </p>
              <p>
                <span className="font-medium">Role:</span>{" "}
                {invitation.role.display_name}
              </p>
            </div>
          )}

          <Button onClick={acceptInvitation} className="w-full">
            Accept Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
