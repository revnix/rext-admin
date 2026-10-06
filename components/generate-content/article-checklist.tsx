import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  ChecklistIssue,
  ContentChecklist,
  Issue,
  SEORESULT,
  TrustScore,
} from "@/types/generate-content";

type ArticleChecklistProps = {
  seoScore: SEORESULT | null;
  checklist: ContentChecklist | null;
  trustScore: TrustScore | null;
};

const scoreWord = (score: number) => {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs work";
};

const DENSITY_STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "neutral" }
> = {
  ok: { label: "In range", variant: "success" },
  too_low: { label: "Too low", variant: "warning" },
  too_high: { label: "Too high", variant: "warning" },
  not_applicable: { label: "Not measured", variant: "neutral" },
};

const percent = (value: number) =>
  `${value.toLocaleString("en", { maximumFractionDigits: 2 })}%`;

/** The one 0 to 100 score: one colour, the track on the inset surface. */
function ScoreRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 28;
  return (
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 size-full -rotate-90"
      >
        <title>On-page score: {value} out of 100</title>
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="6"
          fill="none"
          stroke="currentColor"
          className="text-surface-inset"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="text-foreground"
        />
      </svg>
      <span className="num text-section text-foreground">{value}</span>
    </div>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <dt className="min-w-0 text-table text-muted-foreground">{label}</dt>
      <dd className="shrink-0 text-right">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap text-table text-foreground">
          {value}
        </div>
        {note ? (
          <div className="text-caption text-muted-foreground">{note}</div>
        ) : null}
      </dd>
    </div>
  );
}

function Finding({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <li className="flex items-start gap-2 text-table">
      <Icon
        size={16}
        className={
          ok
            ? "mt-px shrink-0 text-muted-foreground"
            : "mt-px shrink-0 text-foreground"
        }
      />
      <span className={ok ? "text-muted-foreground" : "text-foreground"}>
        {children}
      </span>
    </li>
  );
}

const findingText = (finding: ChecklistIssue) => finding.detail || finding.name;

/**
 * The checklist beside an article (plan E, step 6): the on-page score as the
 * one content score, then readability, keyphrase density, trust and the
 * validator's checks as rows, the issues, and the claims no source supports.
 * There is no detector score. The checklist comes from the backend
 * (`content.checklist` on a saved article, `content.review.checklist` during a
 * run); an article saved before the validator's findings were kept has none.
 */
export function ArticleChecklist({
  seoScore,
  checklist,
  trustScore,
}: ArticleChecklistProps) {
  const readability = checklist?.readability ?? null;
  const density = checklist?.keyphrase_density ?? null;
  const validation = checklist?.validation ?? null;
  const claims = checklist?.claims_to_verify ?? [];
  const trust = trustScore
    ? (trustScore.score ?? trustScore.trust_score)
    : null;

  if (!seoScore && !checklist && trust == null) return null;

  const score = seoScore ? Math.round(seoScore.seo_health_score) : null;
  const onPage: Issue[] = seoScore?.issues ?? [];
  const onPageOpen = onPage.filter((issue) => issue.level !== "GOOD");
  const onPagePassed = onPage.filter((issue) => issue.level === "GOOD");
  const validationFindings = validation
    ? [...validation.issues, ...validation.warnings]
    : [];
  const densityStatus = density?.status
    ? DENSITY_STATUS[density.status]
    : undefined;
  const hasFindings = onPage.length > 0 || validationFindings.length > 0;

  return (
    <section
      aria-labelledby="article-checklist-title"
      className="rounded-md border border-border bg-card"
    >
      <header className="flex items-center gap-4 border-b border-border p-4">
        {score != null ? <ScoreRing value={score} /> : null}
        <div>
          <h3 id="article-checklist-title" className="text-section">
            Checklist
          </h3>
          {score != null ? (
            <p className="text-caption text-muted-foreground">
              On-page score · {scoreWord(score)}
            </p>
          ) : null}
        </div>
      </header>

      <dl className="divide-y divide-border px-4">
        {readability ? (
          <Row
            label="Readability"
            value={
              <>
                {readability.label}
                <span className="num text-muted-foreground">
                  {Math.round(readability.score)}
                </span>
              </>
            }
          />
        ) : null}
        {density && density.value != null ? (
          <Row
            label="Keyphrase density"
            value={
              <>
                <span className="num">{percent(density.value)}</span>
                {densityStatus ? (
                  <Badge variant={densityStatus.variant}>
                    {densityStatus.label}
                  </Badge>
                ) : null}
              </>
            }
            note={
              density.occurrences != null
                ? `${density.occurrences} ${density.occurrences === 1 ? "use" : "uses"}`
                : undefined
            }
          />
        ) : null}
        {trust != null ? (
          <Row
            label="Trust"
            value={<span className="num">{Math.round(trust)}%</span>}
          />
        ) : null}
        {validation ? (
          <Row
            label="Checks"
            value={
              validation.passed ? (
                <Badge variant="success">Passed</Badge>
              ) : (
                <Badge variant="warning">
                  {validation.issues.length} failing
                </Badge>
              )
            }
            note={
              validation.warnings.length > 0
                ? `${validation.warnings.length} ${validation.warnings.length === 1 ? "warning" : "warnings"}`
                : undefined
            }
          />
        ) : null}
      </dl>

      {hasFindings ? (
        <div className="space-y-3 border-t border-border p-4">
          <h4 className="text-label text-foreground">Issues</h4>
          <ul className="space-y-2">
            {validationFindings.map((finding) => (
              <Finding
                key={`check-${finding.name}-${finding.detail}`}
                ok={false}
              >
                {findingText(finding)}
              </Finding>
            ))}
            {onPageOpen.map((issue) => (
              <Finding key={`open-${issue.type}-${issue.message}`} ok={false}>
                {issue.message}
              </Finding>
            ))}
            {onPagePassed.map((issue) => (
              <Finding key={`passed-${issue.type}-${issue.message}`} ok>
                {issue.message}
              </Finding>
            ))}
          </ul>
        </div>
      ) : null}

      {validation || claims.length > 0 ? (
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-label text-foreground">Claims to verify</h4>
            <Badge variant="neutral">
              <span className="num">{claims.length}</span>
            </Badge>
          </div>
          {claims.length > 0 ? (
            <ul className="space-y-3">
              {claims.map((claim) => (
                <li
                  key={`${claim.category}-${claim.sentence}`}
                  className="space-y-1"
                >
                  <p className="text-table text-foreground">{claim.sentence}</p>
                  <p className="text-caption text-muted-foreground">
                    No source for “{claim.unsupported}”
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-muted-foreground">
              Every factual claim has a source.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
