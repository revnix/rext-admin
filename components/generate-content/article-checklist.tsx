import { CheckCircle2 } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { readabilityWord } from "@/lib/content/readability";
import type {
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
      <dt className="min-w-0 text-body text-muted-foreground">{label}</dt>
      <dd className="shrink-0 text-right">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap text-body font-medium text-foreground">
          {value}
        </div>
        {note ? (
          <div className="text-caption text-muted-foreground">{note}</div>
        ) : null}
      </dd>
    </div>
  );
}

/**
 * The checklist beside an article (plan E, step 6): the on-page score as the
 * one content score, then readability (in words), keyphrase density, trust and
 * the validator's checks as rows, and the on-page checks the article passes, as
 * the card's main list. There is no detector score. The checklist comes from
 * the backend (`content.checklist` on a saved article,
 * `content.review.checklist` during a run); an article saved before the
 * validator's findings were kept has none.
 *
 * The open issues and the claims to verify are hidden for now (the founder's
 * feedback v2, #704: "hide the issues for now… hide claims to verify"; "highlight
 * all that checkboxes list in a prominent way").
 */
export function ArticleChecklist({
  seoScore,
  checklist,
  trustScore,
}: ArticleChecklistProps) {
  const readability = checklist?.readability ?? null;
  const density = checklist?.keyphrase_density ?? null;
  const validation = checklist?.validation ?? null;
  const trust = trustScore
    ? (trustScore.score ?? trustScore.trust_score)
    : null;

  // The card shows twice under 1280 px (above the article, and in the side sheet): its own id each.
  const titleId = useId();
  if (!seoScore && !checklist && trust == null) return null;

  const score = seoScore ? Math.round(seoScore.seo_health_score) : null;
  const onPage: Issue[] = seoScore?.issues ?? [];
  const passed = onPage.filter((issue) => issue.level === "GOOD");
  const densityStatus = density?.status
    ? DENSITY_STATUS[density.status]
    : undefined;

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-md border border-border bg-card"
    >
      <header className="flex items-center gap-4 border-b border-border p-4">
        {score != null ? (
          <ScoreRing value={score} label="On-page score" className="size-20" />
        ) : null}
        <div>
          <h3 id={titleId} className="text-section">
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
          <Row label="Readability" value={readabilityWord(readability.score)} />
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

      {passed.length > 0 ? (
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-section text-foreground">Checks passed</h4>
            <Badge variant="success">
              <span className="num">{passed.length}</span>
            </Badge>
          </div>
          <ul className="space-y-2.5">
            {passed.map((issue) => (
              <li
                key={`passed-${issue.type}-${issue.message}`}
                className="flex items-start gap-2.5 text-body text-foreground"
              >
                <CheckCircle2
                  size={20}
                  aria-hidden
                  className="shrink-0 text-foreground"
                />
                <span className="pt-px">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
