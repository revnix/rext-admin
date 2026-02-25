"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Mail, Shield, ShieldCheck } from "lucide-react";
import { OAuthAccounts } from "@/components/account-settings/oauth-accounts";
import { PasswordChange } from "@/components/account-settings/password-change";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div
                  className={`
                  p-2 rounded-lg
                  ${item.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : ""}
                  ${item.status === "warning" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" : ""}
                  ${item.status === "info" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" : ""}
                `}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.label}</p>
                    <p
                      className={`text-sm font-medium
                      ${item.status === "success" ? "text-green-600 dark:text-green-400" : ""}
                      ${item.status === "warning" ? "text-yellow-600 dark:text-yellow-400" : ""}
                      ${item.status === "info" ? "text-muted-foreground" : ""}
                    `}
                    >
                      {item.value}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
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
          <PasswordChange />
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
