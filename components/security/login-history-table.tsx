"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createDataTableColumnHelper,
  DataTable,
  UNKNOWN,
  useDataTableLocalState,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api-client";
import { dateFormat } from "@/lib/formatters/date-formatters";

const PAGE_SIZE = 25;

type SignIn = Awaited<
  ReturnType<typeof apiClient.security.getLoginHistory>
>["history"][number];

function Result({ signIn }: { signIn: SignIn }) {
  return signIn.success ? (
    <Badge variant="neutral">Signed in</Badge>
  ) : (
    <Badge variant="danger">Failed</Badge>
  );
}

function placeOf(signIn: SignIn) {
  return [signIn.location, signIn.ip_address].filter(Boolean).join(" · ");
}

const column = createDataTableColumnHelper<SignIn>();

// The server sorts (newest first) and pages; the table only shows its page.
const columns = column.columns([
  column.accessor("created_at", {
    header: "When",
    cell: ({ getValue }) => dateFormat.shortWithTime(getValue()) || UNKNOWN,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor("success", {
    header: "Result",
    cell: ({ row }) => <Result signIn={row.original} />,
    enableSorting: false,
    enableHiding: false,
  }),
  column.accessor((signIn) => placeOf(signIn), {
    id: "where",
    header: "Where",
    cell: ({ getValue }) => (
      <span className="num">{getValue() || UNKNOWN}</span>
    ),
    enableSorting: false,
  }),
  column.accessor((signIn) => signIn.device ?? signIn.browser ?? "", {
    id: "device",
    header: "Device",
    cell: ({ getValue }) => (
      <span className="line-clamp-1 break-all text-muted-foreground">
        {getValue() || UNKNOWN}
      </span>
    ),
    enableSorting: false,
  }),
]);

/**
 * Every attempt to sign in to the account, successful or not (D8, plans/app/D-pages.md §2.8): when,
 * the result, where from and on what, 25 rows a page, newest first. The backend pages it, at most
 * 100 rows a request.
 */
export function LoginHistoryTable() {
  const state = useDataTableLocalState({ pageSize: PAGE_SIZE });
  const { pageIndex, pageSize } = state.pagination;

  const query = useQuery({
    queryKey: ["login-history", "mine", pageIndex, pageSize],
    queryFn: () =>
      apiClient.security.getLoginHistory({
        limit: pageSize,
        offset: pageIndex * pageSize,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 60000,
  });

  const rows = useMemo(() => query.data?.history ?? [], [query.data]);

  return (
    <DataTable
      caption="Sign-ins to your account"
      columns={columns}
      data={rows}
      getRowId={(signIn) => signIn.id}
      getRowLabel={(signIn) =>
        `${signIn.success ? "Signed in" : "Failed sign-in"}, ${dateFormat.shortWithTime(signIn.created_at)}`
      }
      state={state}
      manual={{ rowCount: query.data?.total_count ?? 0 }}
      isLoading={query.isLoading}
      error={
        query.error ? (
          <div className="flex flex-col items-center gap-3">
            <p>Your sign-in history didn't load.</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        ) : undefined
      }
      emptyState={
        <EmptyState
          title="No sign-ins yet"
          description="Each sign-in to your account shows here, with where it came from."
        />
      }
      viewOptions
      pageSizeOptions={[PAGE_SIZE, 50, 100]}
      renderCard={(signIn) => (
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">
              {dateFormat.shortWithTime(signIn.created_at)}
            </span>
            <Result signIn={signIn} />
          </span>
          {placeOf(signIn) && (
            <p className="num text-sm text-muted-foreground">
              {placeOf(signIn)}
            </p>
          )}
        </div>
      )}
    />
  );
}
