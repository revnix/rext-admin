/**
 * The trial as the shell shows it (plans/app/F-billing.md §2 item 5a): "Trial · 9 days · 35
 * credits left" in the pill, and the banner only when the trial is nearly over. The days rule is
 * the plan's; the credit rule is the backend's low-balance threshold (the catalogue's
 * `credits.low_balance_threshold`), the point below which a run is refused.
 */

/** Under this many days left, the trial is ending. */
export const TRIAL_ENDING_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialState = {
  /** Whole days left, rounded up: what the trial still gives. */
  daysLeft: number;
  /** Calendar days to the end date, in the person's time zone: 0 today, 1 tomorrow. */
  calendarDaysLeft: number;
  creditsLeft: number;
  /** Fewer than TRIAL_ENDING_DAYS days or the low-balance credits left. */
  ending: boolean;
  /** The end date has passed. */
  ended: boolean;
};

export function trialState(
  {
    trialEnd,
    creditsLeft,
    lowCredits,
  }: { trialEnd: string; creditsLeft: number; lowCredits: number },
  now: Date,
): TrialState | null {
  const end = Date.parse(trialEnd);
  if (Number.isNaN(end)) return null;
  const msLeft = end - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));
  const midnight = (time: number) => {
    const day = new Date(time);
    day.setHours(0, 0, 0, 0);
    return day.getTime();
  };
  const calendarDaysLeft = Math.max(
    0,
    Math.round((midnight(end) - midnight(now.getTime())) / DAY_MS),
  );
  return {
    daysLeft,
    calendarDaysLeft,
    creditsLeft,
    ending: msLeft < TRIAL_ENDING_DAYS * DAY_MS || creditsLeft < lowCredits,
    ended: msLeft <= 0,
  };
}

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;
const credits = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? "credit" : "credits"}`;

/** The pill's words: "Trial · 9 days · 35 credits left". */
export function trialPillWords(state: TrialState): string {
  if (state.ended) return "Trial ended";
  const time =
    state.calendarDaysLeft === 0 ? "ends today" : days(state.daysLeft);
  return `Trial · ${time} · ${credits(state.creditsLeft)} left`;
}

/** The ending banner's title: what's running out first. */
export function trialEndingTitle(
  state: TrialState,
  lowCredits: number,
): string {
  if (state.creditsLeft < lowCredits)
    return `${credits(state.creditsLeft)} left in your trial`;
  if (state.calendarDaysLeft === 0) return "Your trial ends today";
  if (state.calendarDaysLeft === 1) return "Your trial ends tomorrow";
  return `Your trial ends in ${days(state.calendarDaysLeft)}`;
}
