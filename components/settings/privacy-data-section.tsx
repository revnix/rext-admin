import { PrivacySettings } from "@/components/account-settings/privacy-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APIErrorBoundary } from "../ui/error-boundary";

/**
 * PrivacyDataSection Component
 *
 * Manages user privacy settings and data export functionality.
 * Allows users to request and download their account data.
 */
export function PrivacyDataSection() {
  return (
    <APIErrorBoundary>
    <Card>
      <CardHeader>
        <CardTitle>Privacy & Data</CardTitle>
        <CardDescription>
          Export your data and manage your account information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PrivacySettings />
      </CardContent>
    </Card>
    </APIErrorBoundary>
  );
}
