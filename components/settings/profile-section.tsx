import { ProfileEdit } from "@/components/account-settings/profile-edit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * ProfileSection Component
 *
 * Displays and manages user profile information including avatar,
 * name, bio, language, and timezone preferences.
 */
export function ProfileSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileEdit />
      </CardContent>
    </Card>
  );
}
