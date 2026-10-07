import {
  type CreditHistoryRow,
  historyDetails,
  historyTitle,
} from "@/lib/billing/credit-history";
import { dateFormat } from "@/lib/formatters/date-formatters";

/**
 * The admin changes to someone's credits (FB2.28), newest first: what happened and how many
 * credits, when and by whom, the reason, then an add's credits left and its expiry. One block a
 * change, so nothing sits side by side that a phone or a dialog would have to scroll to.
 */
export function CreditHistoryList({
  rows,
  label,
  unknownActor,
}: {
  rows: CreditHistoryRow[];
  /** The list's name for assistive technology. */
  label: string;
  /** Who to name when the row doesn't say (an admin whose account is gone). */
  unknownActor: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-col divide-y divide-border">
      {rows.map((row) => {
        const details = historyDetails(row);
        return (
          <li
            key={row.id}
            className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="num text-label text-foreground">
                {historyTitle(row)}
              </p>
              <p className="wrap-anywhere text-caption text-muted-foreground">
                <time dateTime={row.created_at}>
                  {dateFormat.shortWithTime(row.created_at)}
                </time>{" "}
                by {row.by ?? unknownActor}
              </p>
            </div>
            {row.reason && (
              <p className="wrap-anywhere text-body text-foreground">
                <span className="text-muted-foreground">Reason: </span>
                {row.reason}
              </p>
            )}
            {details.length > 0 && (
              <p className="num text-caption text-muted-foreground">
                {details.join(" · ")}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
