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
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { storeInvitationContext } from "@/hooks/use-invited-user-onboarding";
import { apiClient } from "@/lib/api-client";
import { storeWelcomeData } from "@/providers/workspace-welcome-provider";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const token = searchParams.get("token");
  const [isAccepting, setIsAccepting] = useState(false);

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

  const handleAcceptInvitation = useCallback(async () => {
    if (!token || !invitation) return;

    setIsAccepting(true);
    try {
      const result = await apiClient.invitations.accept(token);

      const workspaceData = {
        id: result.workspace_id,
        title: result.workspace_name,
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
        invitation.role?.display_name || invitation.role?.name || "Member";

      // Store welcome modal data (shows first)
      storeWelcomeData({
        workspace: workspaceData,
        inviterName,
        roleName,
      });

      // Store invitation context for onboarding (shows after welcome modal)
      storeInvitationContext({
        workspace: workspaceData,
        inviterName,
        roleName,
        roleDescription: undefined,
        acceptedAt: new Date().toISOString(),
      });

      toast.success(`Welcome to ${result.workspace_name}!`);
      // Redirect to workspace
      router.push(`/w/${result.workspace_slug}`);
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
      invitation &&
      invitation.status === "pending" &&
      !isAccepting
    ) {
      handleAcceptInvitation();
    }
  }, [session, invitation, handleAcceptInvitation, isAccepting]);

  // Handle login redirect
  const handleLogin = () => {
    router.push(`/login?callbackUrl=/invitations/accept?token=${token}`);
  };

  // Handle signup redirect
  const handleSignup = () => {
    router.push(
      `/signup?invitation_token=${token}&email=${encodeURIComponent(invitation?.email || "")}`,
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
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load invitation</AlertTitle>
              <AlertDescription>
                The invitation token is invalid, has expired, or has already
                been used. Please request a new invitation from your workspace
                administrator.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push("/")}
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
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-6 w-6" />
              <CardTitle>
                Invitation{" "}
                {invitation.status === "accepted" ? "Already Used" : "Expired"}
              </CardTitle>
            </div>
            <CardDescription>
              {invitation.status === "accepted"
                ? "This invitation has already been accepted."
                : "This invitation has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {invitation.status === "accepted"
                  ? "Already a member"
                  : "Expired"}
              </AlertTitle>
              <AlertDescription>
                {invitation.status === "accepted"
                  ? `You are already a member of ${invitation.workspace?.title || invitation.workspace?.name || "this workspace"}. You can access the workspace directly.`
                  : `This invitation expired on ${new Date(invitation.expires_at).toLocaleDateString()}. Please request a new invitation from your workspace administrator.`}
              </AlertDescription>
            </Alert>
            {invitation.status === "accepted" && session ? (
              <Button className="w-full" onClick={() => router.push("/")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/")}
              >
                Go to Home
              </Button>
            )}
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
              <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
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
          <div className="flex items-center gap-2 text-primary">
            <Mail className="h-6 w-6" />
            <CardTitle>Workspace Invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Workspace
                </p>
                <p className="text-base font-semibold">
                  {invitation.workspace?.title ||
                    invitation.workspace?.name ||
                    "Workspace"}
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  To accept this invitation, you need to either sign in to your
                  existing account or create a new account with{" "}
                  <span className="font-semibold">{invitation.email}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button className="w-full" onClick={handleSignup}>
                  <User className="h-4 w-4 mr-2" />
                  Create Account & Accept
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleLogin}
                >
                  Sign In & Accept
                </Button>
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
