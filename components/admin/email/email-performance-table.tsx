"use client";

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

interface TemplateStats {
  template_type: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  open_rate: number;
  click_rate: number;
}

interface EmailPerformanceTableProps {
  data: TemplateStats[];
  isLoading: boolean;
}

export function EmailPerformanceTable({
  data,
  isLoading,
}: EmailPerformanceTableProps) {
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

  const formatTemplateName = (templateType: string) => {
    return templateType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRateColor = (rate: number, type: "open" | "click") => {
    if (type === "open") {
      if (rate >= 30) return "text-green-600";
      if (rate >= 20) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (rate >= 5) return "text-green-600";
      if (rate >= 2) return "text-yellow-600";
      return "text-red-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Template</CardTitle>
        <CardDescription>
          Email engagement metrics broken down by template type
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        {data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Opened</TableHead>
                {/* <TableHead className="text-right">Open Rate</TableHead> */}
                <TableHead className="text-right">Clicked</TableHead>
                {/* <TableHead className="text-right">Click Rate</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((template) => (
                <TableRow key={template.template_type}>
                  <TableCell className="font-medium">
                    {formatTemplateName(template.template_type)}
                  </TableCell>
                  <TableCell className="text-right">
                    {template.sent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {template.delivered.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {template.opened.toLocaleString()}
                  </TableCell>
                  {/* <TableCell className="text-right">
                    <span className={getRateColor(template.open_rate, "open")}>
                      {template.open_rate}%
                    </span>
                  </TableCell> */}
                  <TableCell className="text-right">
                    {template.clicked.toLocaleString()}
                  </TableCell>
                  {/* <TableCell className="text-right">
                    <span
                      className={getRateColor(template.click_rate, "click")}
                    >
                      {template.click_rate}%
                    </span>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No template data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
