"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  Shield,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { ADMIN_ROLES } from "@/types/admin-invitation";
import type { Route } from "next";

export default function AcceptAdminInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const token = searchParams.get("token");
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptanceComplete, setAcceptanceComplete] = useState(false);

  // Validate token
  const {
    data: validationData,
    isLoading: isValidating,
    error: validationError,
  } = useQuery({
    queryKey: ["validate-admin-invitation", token],
    queryFn: () => {
      if (!token) throw new Error("No token provided");
      return apiClient.adminInvitations.validateToken(token);
    },
    enabled: !!token,
    retry: false,
  });

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("No token provided");
      return apiClient.adminInvitations.accept(token);
    },
    onSuccess: () => {
      setAcceptanceComplete(true);
      toast.success(
        "Welcome to the admin team! You now have platform admin access.",
      );
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push("/admin" as Route);
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(`Failed to accept invitation: ${error.message}`);
    },
  });

  // Decline invitation mutation
  const declineMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("No token provided");
      return apiClient.adminInvitations.decline(token, "Declined by invitee");
    },
    onSuccess: () => {
      toast.success("Invitation declined successfully");
      router.push("/" as Route);
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline invitation: ${error.message}`);
    },
  });

  const handleAccept = async () => {
    if (!session) {
      // Redirect to login with return URL
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.href as Route)}`,
      );
      return;
    }

    setIsAccepting(true);
    try {
      await acceptMutation.mutateAsync();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await declineMutation.mutateAsync();
    } catch {
      // Error toast handled in onError
    }
  };

  // Loading state
  if (!token || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Validating invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (validationError || !validationData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              {validationData?.error_message ||
                "This invitation link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/" as Route)}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Acceptance complete
  if (acceptanceComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md border-green-500">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invitation Accepted!</CardTitle>
            <CardDescription className="text-center">
              You now have {validationData.admin_role.replace("_", " ")} access
              to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground">
              Redirecting to admin dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleInfo = ADMIN_ROLES.find(
    (r) => r.value === validationData.admin_role,
  );

  // Main invitation view
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">
              Platform Admin Invitation
            </CardTitle>
            <CardDescription>
              You've been invited to join as a platform administrator
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Admin Role
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" className="text-base">
                    {roleInfo?.label || validationData.admin_role}
                  </Badge>
                </div>
                {roleInfo && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {roleInfo.description}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Invited By
              </p>
              <p className="text-sm mt-1">
                {validationData.invited_by_name || validationData.email}
              </p>
            </div>

            {validationData.message && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Personal Message
                  </p>
                  <p className="text-sm mt-1 italic">
                    "{validationData.message}"
                  </p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Invitation Details
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Email:</span>
                  <span className="font-medium">{validationData.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {validationData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Expires:</span>
                  <span className="text-muted-foreground">
                    {new Date(validationData.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Overview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Full platform access</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Manage all workspaces</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>View system analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Invite other admins</span>
              </div>
            </div>
          </div>

          {/* Warning if not logged in */}
          {!session && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Account Required</p>
                <p className="text-yellow-700 mt-1">
                  You need to sign in with the email address this invitation was
                  sent to before accepting.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => void handleDecline()}
            disabled={declineMutation.isPending || isAccepting}
            className="w-full sm:w-auto"
          >
            {declineMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Declining...
              </>
            ) : (
              "Decline"
            )}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full sm:flex-1"
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : !session ? (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In to Accept
              </>
            ) : (
              <>
                Accept Invitation
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
