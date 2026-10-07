"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

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

function formatTemplateName(templateType: string) {
  return templateType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const count = (value: number) => value.toLocaleString();

const column = createDataTableColumnHelper<TemplateStats>();

// One row per template, all of them here, so the table sorts them itself. The open and click rates
// stay off the table, as before.
const columns = column.columns([
  column.accessor((template) => formatTemplateName(template.template_type), {
    id: "template",
    header: "Template",
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue()}</span>
    ),
  }),
  column.accessor("sent", {
    header: "Sent",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => count(getValue()),
  }),
  column.accessor("delivered", {
    header: "Delivered",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => count(getValue()),
  }),
  column.accessor("opened", {
    header: "Opened",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => count(getValue()),
  }),
  column.accessor("clicked", {
    header: "Clicked",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => count(getValue()),
  }),
]);

export function EmailPerformanceTable({
  data,
  isLoading,
}: EmailPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Template</CardTitle>
        <CardDescription>
          Email engagement metrics broken down by template type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="Performance by template"
          columns={columns}
          data={data}
          getRowId={(template) => template.template_type}
          getRowLabel={(template) => formatTemplateName(template.template_type)}
          isLoading={isLoading}
          surface="plain"
          emptyState={<EmptyState title="No template data available" />}
          renderCard={(template) => (
            <div className="flex flex-col gap-1.5">
              <p className="font-medium text-foreground">
                {formatTemplateName(template.template_type)}
              </p>
              <p className="num text-muted-foreground">
                {count(template.sent)} sent · {count(template.delivered)}{" "}
                delivered · {count(template.opened)} opened ·{" "}
                {count(template.clicked)} clicked
              </p>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
