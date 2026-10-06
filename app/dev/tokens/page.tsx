import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { DetailPage } from "@/components/layouts";
import { contrast, type Rgba, toHex, toRgba } from "@/lib/design/colour";
import { type Measured, measure } from "@/lib/design/contrast";
import { readTokens, resolve, type Token } from "@/lib/design/tokens";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Every token of app/globals.css as it renders, with its contrast (task B8). Development only: it reads
// the stylesheet from disk, and a production build answers 404. Values are inlined from the stylesheet's
// text, so a token Tailwind prunes from the CSS still shows.

export const metadata: Metadata = { title: "Tokens" };

const STATUSES = ["success", "warning", "danger", "info"] as const;
const RADII = ["--radius-sm", "--radius-md", "--radius-full"];
const SHADOWS = ["--shadow-hairline", "--shadow-overlay", "--shadow-modal"];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-section">{title}</h2>
        <p className="text-body text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

const ratio = (value: number) => `${value.toFixed(2)} : 1`;

function Swatch({
  name,
  value,
  colour,
  surface,
  ink,
}: {
  name: string;
  value: string;
  colour: Rgba;
  surface: Rgba;
  ink: Rgba;
}) {
  return (
    <div className="space-y-2">
      <div
        className="h-12 rounded-sm border border-border"
        style={{ background: value }}
      />
      <div className="space-y-0.5 text-caption">
        <p className="truncate font-mono text-foreground" title={name}>
          {name}
        </p>
        <p className="font-mono text-muted-foreground">
          {toHex(colour)}
          {colour.alpha < 1 ? ` at ${Math.round(colour.alpha * 100)}%` : ""}
        </p>
        <p className="num whitespace-nowrap text-muted-foreground">
          on page {ratio(contrast(colour, surface))}
        </p>
        {colour.alpha === 1 && (
          <p className="num whitespace-nowrap text-muted-foreground">
            ink on it {ratio(contrast(ink, colour))}
          </p>
        )}
      </div>
    </div>
  );
}

function PairRow({ m, value }: { m: Measured; value: (n: string) => string }) {
  const verdict = m.passes ? "passes" : m.accepted ? "accepted" : "fails";
  // Text as text on its background; an edge as a control's 1 px border, the focus ring as its 2 px ring.
  const sample: CSSProperties =
    m.kind === "text"
      ? { color: value(m.foreground), background: value(m.background) }
      : { borderColor: value(m.foreground), background: value(m.background) };
  return (
    <TableRow className="border-border">
      <TableCell className="py-2 pr-4 pl-0">
        <span
          className={cn(
            "inline-flex h-8 min-w-12 items-center justify-center rounded-sm px-2 text-label",
            m.kind === "edge" && "border",
            m.kind === "ring" && "border-2",
          )}
          style={sample}
        >
          {m.kind === "text" ? "Aa" : ""}
        </span>
      </TableCell>
      <TableCell className="py-2 pr-4 pl-0 text-caption">
        <p className="font-mono break-words">
          {m.foreground} on {m.background}
        </p>
        <p className="num text-muted-foreground">
          {m.kind}, needs {m.minimum} : 1
        </p>
      </TableCell>
      <TableCell className="num whitespace-nowrap py-2 pr-4 pl-0 text-table">
        {ratio(m.ratio)}
      </TableCell>
      <TableCell
        className={cn(
          "py-2 px-0 text-label",
          verdict === "fails" ? "text-danger-600" : "text-success-600",
        )}
      >
        {verdict}
      </TableCell>
    </TableRow>
  );
}

export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const css = fs.readFileSync(
    path.join(process.cwd(), "app/globals.css"),
    "utf8",
  );
  const tokens = readTokens(css);
  const value = (name: string) => {
    const token = tokens.get(name);
    if (!token) throw new Error(`globals.css declares no ${name}`);
    return resolve(tokens, token.value);
  };
  const surface = toRgba(value("--surface"));
  const ink = toRgba(value("--foreground"));
  const colourOrNull = (t: Token) => {
    try {
      return toRgba(resolve(tokens, t.value));
    } catch {
      return null;
    }
  };
  const all = [...tokens.values()];

  const scales = new Map<string, Token[]>();
  for (const t of all.filter((t) => t.block === "@theme static")) {
    // A ramp groups by its name without the step; the accent's four named lines group as one.
    const scale = t.name.startsWith("--accent-")
      ? "accent"
      : t.name.replace(/^--/, "").replace(/-\d+$/, "");
    scales.set(scale, [...(scales.get(scale) ?? []), t]);
  }
  const roles = all.filter(
    (t) =>
      t.block === ":root" &&
      !/^--(success|warning|danger|info)-/.test(t.name) &&
      colourOrNull(t),
  );
  const types = all.filter(
    (t) => /^--text-[\w-]+$/.test(t.name) && !t.name.slice(2).includes("--"),
  );
  const pairs = measure(css);
  const failing = pairs.filter((m) => !m.passes && !m.accepted).length;

  return (
    // Outside the shell (a development page), so it is its own main landmark.
    <main>
      <DetailPage
        title="Tokens"
        description={
          <>
            Every primitive, role, type role, radius and shadow in{" "}
            <code className="font-mono">app/globals.css</code>, with its
            contrast. Ratios follow WCAG 2: text needs 4.5 : 1, a control&apos;s
            edge and the focus ring 3 : 1. {pairs.length} pairs measured,{" "}
            {failing ? `${failing} failing` : "none failing"}.
          </>
        }
      >
        <div className="space-y-12">
          <Section
            title="Pairs"
            description="Every pair the roles make, as the contrast test asserts it (lib/design/contrast.ts)."
          >
            <div className="rounded-md border border-border bg-surface-raised px-4">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="border-border">
                    <TableHead className="h-10 pr-4 pl-0 text-label">
                      Sample
                    </TableHead>
                    <TableHead className="h-10 pr-4 pl-0 text-label">
                      Pair
                    </TableHead>
                    <TableHead className="h-10 pr-4 pl-0 text-label">
                      Ratio
                    </TableHead>
                    <TableHead className="h-10 px-0 text-label">
                      Result
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map((m) => (
                    <PairRow
                      key={`${m.foreground} ${m.background}`}
                      m={m}
                      value={value}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          <Section
            title="Roles"
            description="The names components use. “On page” is the role as text or an edge on --surface; “ink on it” is --foreground on the role."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {roles.map((t) => (
                <Swatch
                  key={t.name}
                  name={t.name}
                  value={value(t.name)}
                  colour={toRgba(value(t.name))}
                  surface={surface}
                  ink={ink}
                />
              ))}
            </div>
          </Section>

          <Section
            title="Status"
            description="Each status in four steps: 50 the tint, 200 the border, 600 text and icons, 700 text on the tint."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {STATUSES.map((status) => (
                <div
                  key={status}
                  className="space-y-3 rounded-md border border-border bg-surface-raised p-4"
                >
                  <span
                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-label"
                    style={{
                      background: value(`--${status}-50`),
                      borderColor: value(`--${status}-200`),
                      color: value(`--${status}-700`),
                    }}
                  >
                    {status[0].toUpperCase() + status.slice(1)}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 200, 600, 700].map((step) => (
                      <Swatch
                        key={step}
                        name={`--${status}-${step}`}
                        value={value(`--${status}-${step}`)}
                        colour={toRgba(value(`--${status}-${step}`))}
                        surface={surface}
                        ink={ink}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Primitives"
            description="The scales in @theme static. Components never name these; the roles point at them."
          >
            <div className="space-y-6">
              {[...scales].map(([scale, steps]) => (
                <div key={scale} className="space-y-2">
                  <h3 className="text-label">{scale}</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {steps.map((t) => (
                      <Swatch
                        key={t.name}
                        name={t.name}
                        value={t.value}
                        colour={toRgba(t.value)}
                        surface={surface}
                        ink={ink}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Type"
            description="The type roles: size, line height, tracking and weight set together."
          >
            <div className="divide-y divide-border rounded-md border border-border bg-surface-raised">
              {types.map((t) => {
                const companion = (key: string) =>
                  tokens.get(`${t.name}--${key}`)?.value;
                const display = /display|page-title/.test(t.name);
                return (
                  <div
                    key={t.name}
                    className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr]"
                  >
                    <div className="space-y-0.5 text-caption text-muted-foreground">
                      <p className="font-mono text-foreground">{t.name}</p>
                      <p className="font-mono">
                        {t.value} / {companion("line-height") ?? "inherit"}
                        {companion("font-weight")
                          ? `, ${companion("font-weight")}`
                          : ""}
                      </p>
                    </div>
                    <p
                      className={display ? "font-display" : undefined}
                      style={{
                        fontSize: t.value,
                        lineHeight: companion("line-height"),
                        letterSpacing: companion("letter-spacing"),
                        fontWeight: companion("font-weight"),
                      }}
                    >
                      Keyword research for 1,284 articles
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            title="Radii and shadows"
            description="Three of each. Controls take the small radius, containers the medium one."
          >
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {[...RADII, ...SHADOWS].map((name) => (
                <div key={name} className="space-y-2">
                  <div
                    className="h-20 border border-border bg-surface-raised"
                    style={
                      name.startsWith("--radius")
                        ? { borderRadius: value(name) }
                        : {
                            borderRadius: value("--radius-md"),
                            boxShadow: value(name),
                            borderColor: "transparent",
                          }
                    }
                  />
                  <p className="font-mono text-caption">{name}</p>
                  <p className="font-mono text-caption text-muted-foreground">
                    {tokens.get(name)?.value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </DetailPage>
    </main>
  );
}
