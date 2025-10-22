import { AccountDeactivation } from "@/components/account-settings/account-deactivation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * DangerZoneSection Component
 *
 * Displays account deactivation controls with appropriate warnings.
 * This is a destructive action that schedules the account for deletion.
 */
export function DangerZoneSection() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Irreversible account actions</CardDescription>
      </CardHeader>
      <CardContent>
        <AccountDeactivation />
      </CardContent>
    </Card>
  );
}
