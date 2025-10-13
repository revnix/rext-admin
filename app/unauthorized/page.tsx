import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a route they don't have permission for.
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>

          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. If you believe this
            is an error, please contact your administrator.
          </p>

          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/settings/account">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
