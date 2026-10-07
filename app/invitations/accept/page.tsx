"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { storeWelcomeData } from "@/providers/workspace-welcome-provider";
import type { Route } from "next";
import { workspaceRoutes } from "@/lib/routes";
import { resetSupportChat } from "@/lib/support-chat/chat";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const token = searchParams.get("token");
  const [isAccepting, setIsAccepting] = useState(false);
  const hasAttemptedAccept = useRef(false);

  // Validate invitation token
  const {
    data: invitationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitation-validate", token],
    queryFn: async () => {
      if (!token) throw new Error("No invitation token provided");
      return await apiClient.invitations.validate(token);
    },
    enabled: !!token,
    retry: false,
  });

  const invitation = invitationData?.invitation;

  // If the backend tells us an account already exists for the invited email,
  // don't offer "Create Account" - it would only fail with a duplicate error.
  const accountExists = Boolean(
    invitationData?.user_exists ?? invitation?.user_exists,
  );

  // The invitation is bound to a specific email. If someone else is already
  // signed in, we must not silently accept it as the wrong account (the backend
  // rejects it anyway) - prompt them to switch accounts instead.
  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const inviteEmail = invitation?.email?.trim().toLowerCase();
  const isWrongAccount =
    !!session &&
    !!sessionEmail &&
    !!inviteEmail &&
    sessionEmail !== inviteEmail;

  const handleSwitchAccount = useCallback(
    async (destination: "login" | "signup") => {
      const params = new URLSearchParams({
        invitation_token: token ?? "",
      });
      if (invitation?.email) params.set("email", invitation.email);
      const target =
        destination === "signup"
          ? `/signup?${params.toString()}`
          : `/login?${params.toString()}`;
      // Another account follows: the support chat's session must not carry over (#711).
      resetSupportChat();
      await signOut({ redirect: false });
      router.push(target as Route);
    },
    [token, invitation?.email, router],
  );

  const handleAcceptInvitation = useCallback(async () => {
    if (!token || !invitation) return;

    setIsAccepting(true);
    try {
      const result = await apiClient.invitations.accept(token);

      const workspaceData = {
        id: result.workspace_id,
        name: result.workspace_name,
        slug: result.workspace_slug,
        url: "",
        created_at: new Date().toISOString(),
      };

      const inviterName =
        typeof invitation.invited_by === "string"
          ? invitation.invited_by
          : invitation.invited_by?.display_name ||
            invitation.invited_by?.full_name ||
            "Workspace Admin";

      const roleName =
        result.role ||
        invitation.role?.display_name ||
        invitation.role?.name ||
        "Member";

      // Store welcome modal data
      storeWelcomeData({
        workspace: workspaceData,
        inviterName,
        roleName,
      });

      toast.success(`Welcome to ${result.workspace_name}!`);
      // Redirect to workspace
      router.push(
        workspaceRoutes.generate_content(result.workspace_slug) as Route,
      );
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to accept invitation: ${err.message}`);
      setIsAccepting(false);
    }
  }, [token, invitation, router]);

  // Auto-accept if user is logged in
  useEffect(() => {
    if (
      session &&
      !isWrongAccount &&
      invitation &&
      invitation.status === "pending" &&
      !isAccepting &&
      !hasAttemptedAccept.current
    ) {
      hasAttemptedAccept.current = true;
      handleAcceptInvitation();
    }
  }, [
    session,
    isWrongAccount,
    invitation,
    isAccepting,
    handleAcceptInvitation,
  ]);

  // Handle login redirect. login-form picks up `invitation_token` and routes
  // back to /invitations/accept after a successful sign-in.
  const handleLogin = () => {
    const params = new URLSearchParams({ invitation_token: token ?? "" });
    if (invitation?.email) params.set("email", invitation.email);
    router.push(`/login?${params.toString()}` as Route);
  };

  // Handle signup redirect
  const handleSignup = () => {
    router.push(
      `/signup?invitation_token=${token}&email=${encodeURIComponent(invitation?.email || "")}` as Route,
    );
  };

  // Loading state
  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - Invalid token
  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invalid invitation</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="danger" title="Unable to load invitation">
              The invitation token is invalid, has expired, or has already been
              used. Please request a new invitation from your workspace
              administrator.
            </Notice>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push("/" as Route)}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-warning-600">
              <Clock className="h-6 w-6" />
              <CardTitle>
                Invitation{" "}
                {invitation.status === "accepted" ? "Already used" : "Expired"}
              </CardTitle>
            </div>
            <CardDescription>
              {invitation.status === "accepted"
                ? "This invitation has already been accepted."
                : "This invitation has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice
              tone="info"
              title={
                invitation.status === "accepted"
                  ? "Already a member"
                  : "Expired"
              }
            >
              {invitation.status === "accepted"
                ? `You are already a member of ${invitation.workspace?.name || "this workspace"}. You can access the workspace directly.`
                : `This invitation expired on ${new Date(invitation.expires_at).toLocaleDateString()}. Please request a new invitation from your workspace administrator.`}
            </Notice>
            {invitation.status === "accepted" && session ? (
              <Button
                className="w-full"
                onClick={() => router.push("/" as Route)}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/" as Route)}
              >
                Go to Home
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signed in as the wrong account - the invitation is for a different email
  if (isWrongAccount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-warning-600">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Wrong account</CardTitle>
            </div>
            <CardDescription>
              This invitation is for a different email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="warning" title="Switch accounts to continue">
              This invitation was sent to{" "}
              <span className="font-semibold">{invitation.email}</span>, but
              you're currently signed in as{" "}
              <span className="font-semibold">{session?.user?.email}</span>.
            </Notice>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleSwitchAccount("login")}
              >
                Sign out & sign in as {invitation.email}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleSwitchAccount("signup")}
              >
                Sign out & create account for {invitation.email}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is accepting (logged in)
  if (session && isAccepting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success-600 animate-pulse" />
              Accepting Invitation...
            </CardTitle>
            <CardDescription>
              Please wait while we add you to the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - User needs to login/signup
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-6 w-6" />
            <CardTitle>Workspace invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-3 border rounded-md p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Workspace
                </p>
                <p className="text-base font-semibold">
                  {invitation.workspace?.name || "Workspace"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Role
                </p>
                <p className="text-base font-semibold">
                  {invitation.role?.display_name ||
                    invitation.role?.name ||
                    "Member"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Invited by
                </p>
                <p className="text-base font-semibold">
                  {typeof invitation.invited_by === "string"
                    ? invitation.invited_by
                    : invitation.invited_by?.display_name ||
                      invitation.invited_by?.full_name ||
                      "Workspace Admin"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Expires
                </p>
                <p className="text-base font-semibold">
                  {new Date(invitation.expires_at).toLocaleDateString()} at{" "}
                  {new Date(invitation.expires_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!session ? (
            <div className="space-y-3">
              <Notice tone="info" title="Sign in required">
                {accountExists ? (
                  <>
                    An account already exists for{" "}
                    <span className="font-semibold">{invitation.email}</span>.
                    Sign in to accept this invitation.
                  </>
                ) : (
                  <>
                    To accept this invitation, you need to either sign in to
                    your existing account or create a new account with{" "}
                    <span className="font-semibold">{invitation.email}</span>
                  </>
                )}
              </Notice>

              <div className="space-y-2">
                <Button className="w-full" onClick={handleLogin}>
                  Sign In & Accept
                </Button>
                {!accountExists && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleSignup}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Create Account & Accept
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You will be redirected back to accept the invitation after
                authentication
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
