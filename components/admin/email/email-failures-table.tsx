"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Button } from "@/components/ui/button";

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

const ITEMS_PER_PAGE = 10;

export function EmailFailuresTable({
  data,
  isLoading,
}: EmailFailuresTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  // Reset to the first page when the data changes
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

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
        {data.length > 0 ? (
          <>
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
                {paginatedData.map((failure) => (
                  <TableRow key={failure.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, data.length)} of{" "}
                  {data.length}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="mb-2 h-8 w-8 text-green-500" />
            <p>No failures found - all emails delivered successfully!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
