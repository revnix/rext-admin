import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Workspace Not Found Page
 *
 * Displayed when a workspace ID doesn't exist or user doesn't have access.
 */
export default function WorkspaceNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Workspace Not Found</CardTitle>
          </div>
          <CardDescription>
            The workspace you're looking for doesn't exist or you don't have
            access to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button data-rec="show" asChild variant="default" className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Workspaces
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
