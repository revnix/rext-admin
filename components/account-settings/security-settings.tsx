"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, LogIn, Mail, Shield, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { formatSecurityDate } from "@/lib/formatters/security-date";

export function SecuritySettings() {
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
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
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
          ? "Your account requires an additional verification step"
          : profile.two_factor_enabled === false
            ? "Enable 2FA to improve account security"
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
      label: "Last Login",
      value: "Information not available",
      description: "Last time you logged into your account",
      status: "info",
    },
    {
      icon: LogIn,
      label: "Login Count",
      value: "Information not available",
      description: "Total number of successful logins",
      status: "info",
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
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {securityItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <div
              className={`
              p-2 rounded-lg
              ${item.status === "success" ? "bg-green-100 text-green-700" : ""}
              ${item.status === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
              ${item.status === "info" ? "bg-blue-100 text-blue-700" : ""}
            `}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.label}</p>
                <p
                  className={`text-sm font-medium
                  ${item.status === "success" ? "text-green-600" : ""}
                  ${item.status === "warning" ? "text-yellow-600" : ""}
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

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Account created on{" "}
          {formatSecurityDate(profile.created_at)}
        </p>
      </div>
    </div>
  );
}
