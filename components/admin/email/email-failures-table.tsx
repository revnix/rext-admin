"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmailFailure {
  id: string;
  to: string;
  template_type: string;
  status: string;
  error_message: string;
  sent_at: string;
}

interface EmailFailuresTableProps {
  data: EmailFailure[];
  isLoading: boolean;
}

export function EmailFailuresTable({
  data,
  isLoading,
}: EmailFailuresTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton loader
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatTemplateName = (templateType: string) => {
    return templateType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    if (status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (status === "bounced") {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          Bounced
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Recent Email Failures
        </CardTitle>
        <CardDescription>
          Emails that failed to send or bounced (last 100 failures)
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        {data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((failure) => (
                <TableRow key={failure.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {failure.to}
                  </TableCell>
                  <TableCell>
                    {formatTemplateName(failure.template_type)}
                  </TableCell>
                  <TableCell>{getStatusBadge(failure.status)}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <span className="text-sm text-muted-foreground">
                      {failure.error_message}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDate(failure.sent_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 text-green-500" />
            <p>No failures found - all emails delivered successfully!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
