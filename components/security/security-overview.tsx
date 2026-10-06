"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Loader2, Mail, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { OAuthAccounts } from "@/components/account-settings/oauth-accounts";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export function SecurityOverview() {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient.profile.get(),
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      apiClient.profile.resendVerification(profile?.email ?? ""),
    onSuccess: (data) => {
      toast.success(data.message || "Verification email sent successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend verification email");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load security information. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return null;
  }

  const securityItems = [
    {
      icon: Mail,
      label: "Email Verification",
      value: profile.email_verified ? "Verified" : "Not Verified",
      description: profile.email_verified
        ? "Your email address has been verified"
        : "Please verify your email address",
      status: profile.email_verified ? "success" : "warning",
    },
    {
      icon: Shield,
      label: "Account Status",
      value: profile.status
        ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1)
        : "Unknown",
      description: "Current status of your account",
      status: profile.status === "active" ? "success" : "warning",
    },
    {
      icon: ShieldCheck,
      label: "Two-Factor Authentication",
      value:
        profile.two_factor_enabled === true
          ? "Enabled"
          : profile.two_factor_enabled === false
            ? "Not enabled"
            : "Unavailable",
      description:
        profile.two_factor_enabled === true
          ? "Your account requires a second authentication factor"
          : profile.two_factor_enabled === false
            ? "Enable 2FA to add stronger account protection"
            : "2FA status is not available from the current profile API",
      status:
        profile.two_factor_enabled === true
          ? "success"
          : profile.two_factor_enabled === false
            ? "warning"
            : "info",
    },
    {
      icon: Clock,
      label: "Account Created",
      value: profile.created_at
        ? format(new Date(profile.created_at), "MMMM d, yyyy")
        : "Unknown",
      description: "When your account was created",
      status: "info",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
          <CardDescription>
            View your account security details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border rounded-md hover:bg-accent/5 transition-colors"
              >
                <div className="p-2 text-muted-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-medium">{item.label}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {item.label === "Email Verification" &&
                        !profile.email_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full sm:w-auto"
                            onClick={() => resendMutation.mutate()}
                            disabled={resendMutation.isPending}
                          >
                            {resendMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Resending...
                              </>
                            ) : (
                              "Resend"
                            )}
                          </Button>
                        )}
                      <p
                        className={`text-sm font-medium
                        ${item.status === "success" ? "text-success-600" : ""}
                        ${item.status === "warning" ? "text-warning-600" : ""}
                        ${item.status === "info" ? "text-muted-foreground" : ""}
                      `}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center sm:text-start">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* OAuth Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage third-party accounts connected to your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthAccounts />
        </CardContent>
      </Card>
    </div>
  );
}
