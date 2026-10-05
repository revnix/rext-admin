import {
  describeMonthlyVolume,
  formatCompactVolume,
  type MonthlyVolumeInput,
} from "@/lib/generate-content/monthly-volume";

/**
 * A keyword's average monthly search volume. Only the number the analysis
 * measured: the trend line that used to sit beneath it was drawn from a sine
 * wave, not from data, so it is gone until a real monthly series exists.
 */
export function MonthlyVolumeCard({ volume }: { volume: number }) {
  return (
    <div className="flex flex-col">
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {formatCompactVolume(volume)}
      </p>
      <p className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">
        Avg. searches per month
      </p>
    </div>
  );
}

/** The volume, or the words for why there is none (the backend's volume_status). */
export function MonthlyVolume({
  volume,
  status,
  timedOut = false,
}: {
  volume: MonthlyVolumeInput;
  status?: string | null;
  /** The analysis never sent a volume within the wait. */
  timedOut?: boolean;
}) {
  if (timedOut && volume === undefined && !status) {
    return (
      <MonthlyVolumeMessage
        label="Not available"
        detail="The keyword analysis did not return a search volume."
      />
    );
  }
  const display = describeMonthlyVolume(volume, status);
  if (display.kind === "volume") {
    return <MonthlyVolumeCard volume={display.volume} />;
  }
  return <MonthlyVolumeMessage label={display.label} detail={display.detail} />;
}

/** A volume that is not a number: what happened, in a word or two, and why. */
export function MonthlyVolumeMessage({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
