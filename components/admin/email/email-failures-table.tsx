"use client";

import { AlertTriangle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
  UNKNOWN,
  useDataTableLocalState,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { dateFormat } from "@/lib/formatters/date-formatters";

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

const STATUS_BADGE: Record<
  string,
  { variant: BadgeProps["variant"]; text: string }
> = {
  failed: { variant: "danger", text: "Failed" },
  bounced: { variant: "warning", text: "Bounced" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status];
  return (
    <Badge variant={config?.variant ?? "neutral"}>
      {config?.text ?? status}
    </Badge>
  );
}

function formatTemplateName(templateType: string) {
  return templateType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const column = createDataTableColumnHelper<EmailFailure>();

// The whole list is here (the last 100 failures), so the table sorts and pages it itself.
const columns = column.columns([
  column.accessor("to", {
    header: "Recipient",
    cell: ({ getValue }) => (
      <span className="block max-w-50 truncate font-medium text-foreground">
        {getValue()}
      </span>
    ),
  }),
  column.accessor((failure) => formatTemplateName(failure.template_type), {
    id: "template",
    header: "Template",
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  column.accessor("error_message", {
    header: "Error",
    cell: ({ getValue }) => (
      <p className="max-w-75 text-muted-foreground">{getValue() || UNKNOWN}</p>
    ),
    enableSorting: false,
  }),
  column.accessor((failure) => Date.parse(failure.sent_at) || 0, {
    id: "sent_at",
    header: "Date",
    meta: { align: "end", numeric: true },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {dateFormat.shortWithTime(row.original.sent_at) || UNKNOWN}
      </span>
    ),
    sortFn: "basic",
  }),
]);

export function EmailFailuresTable({
  data,
  isLoading,
}: EmailFailuresTableProps) {
  const tableState = useDataTableLocalState({ pageSize: ITEMS_PER_PAGE });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-danger-600" />
          Recent Email Failures
        </CardTitle>

        <CardDescription>
          Emails that failed to send or bounced (last 100 failures)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <DataTable
          caption="Recent email failures"
          columns={columns}
          data={data}
          getRowId={(failure) => failure.id}
          getRowLabel={(failure) =>
            `${failure.to}, ${formatTemplateName(failure.template_type)}`
          }
          state={tableState}
          isLoading={isLoading}
          surface="plain"
          emptyState={
            <EmptyState
              title="No failures found"
              description="All emails were delivered."
            />
          }
          renderCard={(failure) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium text-foreground">
                  {failure.to}
                </p>
                <StatusBadge status={failure.status} />
              </div>
              <p className="text-muted-foreground">
                {formatTemplateName(failure.template_type)} ·{" "}
                <span className="num">
                  {dateFormat.shortWithTime(failure.sent_at) || UNKNOWN}
                </span>
              </p>
              {failure.error_message && (
                <p className="line-clamp-2 text-muted-foreground">
                  {failure.error_message}
                </p>
              )}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
