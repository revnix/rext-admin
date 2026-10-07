"use client";

import { Copy, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { z } from "zod";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { PasswordInput } from "@/components/forms/password-input";
import { ToggleController } from "@/components/forms/toggle-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { RunProgress } from "@/components/generate-content/run-progress";
import {
  DetailPage,
  SidePaneTrigger,
  WithSidePane,
} from "@/components/layouts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup } from "@/components/ui/radio-group";
import { RouteError } from "@/components/ui/route-error";
import { ScoreRing } from "@/components/ui/score-ring";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RunStageDetail } from "@/lib/generate-content/run-stages";

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

/** A labelled row of examples that wraps on a narrow screen. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <p className="w-28 shrink-0 text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const BADGE_VARIANTS = [
  "neutral",
  "success",
  "warning",
  "danger",
  "info",
] as const;

const NOTICE_TONES = ["info", "warning", "danger", "success"] as const;

const sampleSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  password: z.string().min(8, "At least 8 characters"),
  choice: z.string().min(1, "Choose an option"),
  note: z.string().max(140, "Keep it under 140 characters").optional(),
  agreed: z.boolean().refine((value) => value, "Tick this to go on"),
  public: z.boolean(),
});

/** Every field kind on the field set, its states shown by submitting it empty. */
function SampleForm() {
  const form = useZodForm(sampleSchema, {
    defaultValues: {
      name: "",
      password: "",
      choice: "",
      note: "",
      agreed: false,
      public: true,
    },
  });
  return (
    <FormShell
      form={form}
      onSubmit={() => undefined}
      submitLabel="Check the fields"
    >
      <FormSection
        title="A form section"
        description="Submit it empty to see each field's error; a field checks itself when it loses focus."
      >
        <FieldController
          control={form.control}
          name="name"
          label="Name"
          required
          description="The help text sits beneath the control; an error replaces it."
        >
          {(field) => <Input {...field} placeholder="A placeholder" />}
        </FieldController>
        <FieldController
          control={form.control}
          name="password"
          label="Password"
          required
        >
          {(field) => <PasswordInput {...field} autoComplete="off" />}
        </FieldController>
        <FieldController
          control={form.control}
          name="choice"
          label="A select"
          required
        >
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={field.id}
                aria-invalid={field["aria-invalid"]}
                aria-describedby={field["aria-describedby"]}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">Option one</SelectItem>
                <SelectItem value="two">Option two</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FieldController>
        <FieldController
          control={form.control}
          name="note"
          label="Note"
          maxLength={140}
        >
          {(field) => (
            <Textarea {...field} value={field.value ?? ""} rows={3} />
          )}
        </FieldController>
        <ToggleController
          control={form.control}
          name="agreed"
          label="A checkbox before its label"
          description="ToggleController, kind checkbox."
        />
        <ToggleController
          control={form.control}
          name="public"
          kind="switch"
          label="A switch after its label"
          description="ToggleController, kind switch."
        />
      </FormSection>
    </FormShell>
  );
}

/**
 * Throws once mounted, so the boundary around it shows its fallback (and Try again throws again).
 * Not during the server render: a boundary catches nothing there, and the page would fail.
 */
function Thrower(): ReactNode {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (mounted) throw new Error("A sample failure for /dev/primitives");
  return null;
}

const SAMPLE_ROUTE_ERROR = Object.assign(new Error("A sample route error"), {
  digest: "1234567890",
});

interface SampleRow {
  id: string;
  title: string;
  status: "draft" | "published" | "failed";
  words: number;
}

const SAMPLE_STATUSES: SampleRow["status"][] = ["published", "draft", "failed"];

// Thirty rows, more than a page of 25, so the pagination shows.
const SAMPLE_ROWS: SampleRow[] = Array.from({ length: 30 }, (_, index) => ({
  id: String(index + 1),
  title: `Sample article ${index + 1}`,
  status: SAMPLE_STATUSES[index % 3],
  words: index % 3 === 2 ? 0 : 600 + index * 47,
}));

const STATUS_TINT = {
  draft: "neutral",
  published: "success",
  failed: "danger",
} as const;

const column = createDataTableColumnHelper<SampleRow>();
const sampleColumns = column.columns([
  column.accessor("title", { header: "Title", sortFn: "text" }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={STATUS_TINT[getValue()]}>{getValue()}</Badge>
    ),
  }),
  column.accessor("words", {
    header: "Words",
    meta: { align: "end", numeric: true },
    cell: ({ getValue }) => getValue().toLocaleString("en-US"),
  }),
]);

/** The five page layouts, each with a page that uses it (design/app-language.md §6). */
const LAYOUTS = [
  { name: "ListPage", use: "Lists of things", example: "/w/rext-ai/content" },
  { name: "DetailPage", use: "One thing", example: "/dev/tokens" },
  {
    name: "FormPage",
    use: "Create and edit",
    example: "/w/rext-ai/personas/create",
  },
  {
    name: "SettingsPage",
    use: "Account and workspace settings",
    example: "/settings",
  },
  {
    name: "WorkingSurface",
    use: "The outline, the calendar, the editor, Generate",
    example: "/w/rext-ai/content/calendar",
  },
];

/** WorkingSurface's options, and WithSidePane's for a step's own two panes. */
const SURFACE_PROPS = [
  {
    name: "side",
    use: "The side pane: beside the main pane from 1024\u00a0px, a sheet behind a button under it",
  },
  {
    name: "sideTitle",
    use: "Names the pane: its landmark, its button and its sheet's title (Details by default)",
  },
  {
    name: "trigger",
    use: "WithSidePane: floating at the bottom right (default), or inline where the page renders SidePaneTrigger",
  },
  {
    name: "showTitle",
    use: "WithSidePane: the title above the pane on wide screens too, for content without a heading",
  },
  { name: "flush", use: "WorkingSurface: no room above and below the surface" },
  {
    name: "ownHeading",
    use: "WorkingSurface: the surface draws the page's h1 itself (the editor), so no header",
  },
];

const SAMPLE_OUTLINE = [
  { level: 2, heading: "What a content calendar template is" },
  { level: 3, heading: "The columns a small team needs" },
  { level: 2, heading: "How to fill it for a month" },
  { level: 3, heading: "Planning around launches" },
  { level: 2, heading: "Keeping it up to date" },
];

/**
 * The two panes as the outline step uses them: the outline in the main pane, the brief beside it
 * from 1024 px, and under 1024 px the brief in a sheet behind a button in the step's own flow.
 */
function WorkingSurfaceSample() {
  return (
    <WithSidePane
      sideTitle="Brief"
      trigger="inline"
      side={
        <dl className="space-y-3 rounded-md border border-border p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Keyword</dt>
            <dd>content calendar template</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Length</dt>
            <dd className="num">1,600 words</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Persona</dt>
            <dd>Marketing lead at a small team</dd>
          </div>
        </dl>
      }
    >
      <div className="space-y-3">
        <ol className="divide-y divide-border rounded-md border border-border">
          {SAMPLE_OUTLINE.map((item) => (
            <li
              key={item.heading}
              className={item.level === 3 ? "py-2 pr-4 pl-8" : "px-4 py-2"}
            >
              <span className="mr-2 font-mono text-xs text-muted-foreground">
                H{item.level}
              </span>
              <span className="text-sm">{item.heading}</span>
            </li>
          ))}
        </ol>
        <SidePaneTrigger size="default" />
      </div>
    </WithSidePane>
  );
}

const NOW = Date.now();
const SAMPLE_STAGES = [
  {
    id: "analysis",
    label: "Reading the results",
    state: "complete" as const,
    startedAt: NOW - 90_000,
    endedAt: NOW - 60_000,
  },
  {
    id: "outline",
    label: "Writing the outline",
    state: "active" as const,
    startedAt: NOW - 20_000,
  },
  { id: "article", label: "Writing the article", state: "pending" as const },
  { id: "images", label: "Adding images", state: "skipped" as const },
];

// A run saying what it found (rext-control task 694). Fixture findings: on the Generate page they are
// read from the run's stream (lib/generate-content/run-findings.ts).
const FOUND_STAGES = [
  {
    id: "search-results",
    label: "Reading the search results",
    state: "complete" as const,
    startedAt: NOW - 13_000,
    endedAt: NOW - 4000,
  },
  {
    id: "competitors",
    label: "Finding competitors",
    state: "active" as const,
    startedAt: NOW - 4000,
  },
  { id: "measure", label: "Measuring the keyword", state: "pending" as const },
];
const FOUND_DETAILS: Record<string, RunStageDetail> = {
  "search-results": {
    result:
      "10 results from 8 sites · 6 questions people ask · 8 related searches",
    items: {
      kind: "results",
      preview: 3,
      items: [
        "Vegetable Garden Planner | The Old Farmer’s Almanac",
        "Kitchen Garden Planner | Gardener’s Supply",
        "Garden Planner: Plan Your Vegetable Garden Online",
        "Free Vegetable Garden Layout Tool",
        "How to Plan a Vegetable Garden: a Step-by-Step Guide",
      ].map((title, index) => ({
        position: index + 1,
        title,
        site: [
          "almanac.com",
          "gardeners.com",
          "growveg.com",
          "smartgardener.com",
          "thespruce.com",
        ][index],
      })),
    },
  },
  competitors: {
    live: "Working out what each of the 8 sites offers: a guide to learn from, a tool, or a shop.",
    items: {
      kind: "chips",
      items: [
        "almanac.com",
        "gardeners.com",
        "growveg.com",
        "smartgardener.com",
        "reddit.com",
        "burpee.com",
        "seedtime.us",
        "thespruce.com",
      ],
    },
  },
  measure: {
    waiting:
      "Monthly searches, how hard it is to rank, and the links behind the top pages.",
  },
};
const TITLE_STAGES = [
  {
    id: "titles",
    label: "Writing five titles",
    state: "active" as const,
    startedAt: NOW - 7000,
  },
  {
    id: "title-checks",
    label: "Checking each title",
    state: "pending" as const,
  },
];
const TITLE_DETAILS: Record<string, RunStageDetail> = {
  titles: {
    live: "3 of 5 written, from 8 related searches and 6 questions people ask.",
    progress: { done: 3, total: 5, label: "titles written" },
    items: {
      kind: "titles",
      rows: [
        {
          title: "Vegetable Garden Planner: Map Your Beds in One Afternoon",
          state: "written",
          checks: [
            { label: "Has the keyword", met: true },
            { label: "56 characters", met: true },
          ],
        },
        {
          title: "How to Use a Vegetable Garden Planner in Your First Season",
          state: "written",
          checks: [
            { label: "Has the keyword", met: true },
            { label: "58 characters", met: true },
          ],
          recommended: true,
          reason: "It answers what most searchers ask first.",
        },
        {
          title:
            "Vegetable Garden Planner Tips for a Bigger Harvest All Year Round",
          state: "written",
          checks: [
            { label: "Has the keyword", met: true },
            { label: "65 characters, over 59", met: false },
          ],
        },
        {
          title: "Free Vegetable Garden Planner Templates for",
          state: "writing",
          checks: [],
        },
        { title: "Fifth title", state: "next", checks: [] },
      ],
    },
  },
  "title-checks": {
    waiting:
      "Each one must contain “vegetable garden planner” and run 50 to 59 characters. Any that don’t are rewritten.",
  },
};

/**
 * The gallery behind /dev/primitives: every primitive in `components/ui` and `components/forms` in
 * its variants and states, on the tokens, at the width the window gives it.
 */
export function PrimitivesGallery() {
  const [lens, setLens] = useState("month");
  return (
    <DetailPage
      title="Primitives"
      description="Every primitive in each variant and state, on the tokens (design/app-language.md §6). Look at a changed primitive here first, at 390, 820 and 1440 px."
    >
      <div className="space-y-12">
        <Section
          title="Buttons"
          description="Six variants, three sizes and an icon size; disabled, loading, and an icon-only button with its name for screen readers."
        >
          <div className="space-y-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Row key={variant} label={variant}>
                <Button variant={variant} size="sm">
                  Small
                </Button>
                <Button variant={variant}>Default</Button>
                <Button variant={variant} size="lg">
                  Large
                </Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </Row>
            ))}
            <Row label="states">
              <Button disabled>
                <Loader2 className="animate-spin" aria-hidden />
                Saving…
              </Button>
              <Button>
                <Plus aria-hidden />
                With an icon
              </Button>
              <Button variant="outline" size="icon" aria-label="Copy">
                <Copy />
              </Button>
              <Button variant="ghost" size="icon" aria-label="More">
                <MoreHorizontal />
              </Button>
            </Row>
          </div>
        </Section>

        <Section
          title="Fields"
          description="The field set (components/forms): FieldController for an input, a password, a select, a textarea with a count; ToggleController for a checkbox and a switch; FormShell's submit row."
        >
          <div className="max-w-(--form-max)">
            <SampleForm />
          </div>
          <Row label="radio group">
            <RadioGroup
              options={[
                { value: "month", label: "Month" },
                { value: "board", label: "Board" },
                { value: "list", label: "List" },
              ]}
              value={lens}
              onValueChange={setLens}
              orientation="horizontal"
            />
          </Row>
          <Row label="input states">
            {/* Outside a FieldController, so each names itself: a field's name is never its placeholder. */}
            <Input
              placeholder="Placeholder"
              aria-label="An empty field"
              className="w-48"
            />
            <Input
              defaultValue="Disabled"
              aria-label="A disabled field"
              disabled
              className="w-48"
            />
            <Input
              defaultValue="Invalid"
              aria-label="An invalid field"
              aria-invalid
              className="w-48"
            />
          </Row>
        </Section>

        <Section
          title="Badges"
          description="A word, never an icon: neutral by default, a status tint only when the word is a status worth noticing."
        >
          <Row label="variants">
            {BADGE_VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </Row>
        </Section>

        <Section
          title="Notices"
          description="The one box for info, warning, danger and success: an icon, a title, a sentence, an optional action and close button."
        >
          <div className="space-y-3">
            {NOTICE_TONES.map((tone) => (
              <Notice
                key={tone}
                tone={tone}
                title={`A ${tone} notice`}
                action={
                  tone === "danger" ? (
                    <Button variant="outline" size="sm">
                      Try again
                    </Button>
                  ) : undefined
                }
                onDismiss={tone === "info" ? () => undefined : undefined}
              >
                One sentence that says what happened and what to do.
              </Notice>
            ))}
          </div>
        </Section>

        <Section
          title="Overlays"
          description="A dialog for one purpose and four fields or fewer, a sheet for a row in context, a confirmation that names its action, a popover, a menu and a tooltip."
        >
          <Row label="open one">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename the workspace</DialogTitle>
                  <DialogDescription>
                    A dialog fills the screen under 640 px.
                  </DialogDescription>
                </DialogHeader>
                <Input defaultValue="Rext AI" aria-label="Workspace name" />
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Rename</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>A row in context</SheetTitle>
                  <SheetDescription>
                    The list stays in view behind it.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <ConfirmationDialog
              title="Delete this article?"
              description="It goes to the trash for 30 days."
              confirmText="Delete article"
              cancelText="Keep article"
              variant="destructive"
              onConfirm={() => undefined}
            >
              <Button variant="destructive">
                <Trash2 aria-hidden />
                Confirmation
              </Button>
            </ConfirmationDialog>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm">
                A popover holds a little more than a tooltip.
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>An article</DropdownMenuLabel>
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>A short hint</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Row>
        </Section>

        <Section
          title="Tabs"
          description="Facets of one thing, or the lenses of one set (the calendar's month, board and list)."
        >
          <Tabs defaultValue="one" className="gap-4">
            <TabsList aria-label="Example">
              <TabsTrigger value="one">First</TabsTrigger>
              <TabsTrigger value="two">Second</TabsTrigger>
              <TabsTrigger value="three">Third</TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="text-sm text-muted-foreground">
              The first tab's content.
            </TabsContent>
            <TabsContent value="two" className="text-sm text-muted-foreground">
              The second tab's content.
            </TabsContent>
            <TabsContent
              value="three"
              className="text-sm text-muted-foreground"
            >
              The third tab's content.
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          title="States"
          description="Loading shows after 200 ms, shaped like what it stands for; empty has a title, one sentence and one action."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton and spinner</CardTitle>
                <CardDescription>On the inset surface.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Spinner />
              </CardContent>
            </Card>
            <Card>
              <EmptyState
                title="No articles yet"
                description="Generate your first one from a keyword."
                action={{ label: "Generate", onClick: () => undefined }}
              />
            </Card>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ErrorBoundary around a part that throws
              </p>
              <ErrorBoundary title="This sample part didn't load">
                <Thrower />
              </ErrorBoundary>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                RouteError inside a page layout (an error.tsx)
              </p>
              <RouteError
                error={SAMPLE_ROUTE_ERROR}
                reset={() => undefined}
                title="This sample page hit an error"
                logContext="dev/primitives"
                layout="inline"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Progress and scores"
          description="The credits meter (and its 80 % mark), a score ring, a bar and a run's stages: plain, and saying what each one found."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Fixture numbers: the real meter reads the plan's credits from the backend. */}
              <Meter value={412} max={1000} label="412 of 1,000 used" />
              <Meter value={880} max={1000} low label="880 of 1,000 used" />
              <Progress value={60} aria-label="Sample progress" />
              <div className="flex flex-wrap gap-6">
                <ScoreRing value={86} label="SEO score" />
                <ScoreRing value={52} label="Readability" />
              </div>
            </div>
            <RunProgress stages={SAMPLE_STAGES} />
          </div>
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
            <RunProgress
              stages={FOUND_STAGES}
              header={{
                title: "Analysing “vegetable garden planner”",
                subtitle: "Google · United States",
                startedAt: NOW - 13_000,
              }}
              details={FOUND_DETAILS}
              footer="You can leave this page. The analysis keeps going, and we’ll tell you when it’s ready."
            />
            <RunProgress
              stages={TITLE_STAGES}
              header={{
                title: "Writing titles for “vegetable garden planner”",
                subtitle: "How-to guide · for readers who want to learn",
                startedAt: NOW - 7000,
              }}
              details={TITLE_DETAILS}
              footer="You can leave this page. The titles keep coming, and we’ll tell you when they’re ready."
            />
          </div>
        </Section>

        <Section
          title="Data"
          description="One DataTable for every list: a toolbar, headers that sort, a row menu, pagination, and cards under 640 px."
        >
          <DataTable
            caption="Sample articles"
            columns={sampleColumns}
            data={SAMPLE_ROWS}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.title}
            search={{ placeholder: "Search the sample" }}
            rowActions={() => [
              { label: "Open" },
              { label: "Delete", destructive: true },
            ]}
            renderCard={(row, { actions }) => (
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{row.title}</span>
                  <Badge variant={STATUS_TINT[row.status]}>{row.status}</Badge>
                </div>
                {actions}
              </div>
            )}
          />
          <Row label="small things">
            <Avatar>
              <AvatarFallback>SU</AvatarFallback>
            </Avatar>
            <Kbd>C</Kbd>
            <span className="num font-mono text-sm">1,234 · 56.7 %</span>
          </Row>
        </Section>

        <Section
          title="Layouts"
          description="A page renders one of the five layouts and sets no widths, paddings or heading sizes of its own; this page is a DetailPage."
        >
          <ul className="divide-y divide-border rounded-md border border-border">
            {LAYOUTS.map((layout) => (
              <li
                key={layout.name}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-mono text-sm">{layout.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    · {layout.use}
                  </span>
                </span>
                <Link href={layout.example as Route} className="text-sm link">
                  {layout.example}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Working surface"
          description="Two panes, as the outline step uses them: the main pane takes the width, and the side pane sits beside it from 1024&nbsp;px. Under 1024&nbsp;px the side pane is a sheet behind a button (narrow this window to see it). The button floats at the bottom right by default; a step that ends with its own buttons puts it in its flow instead, as here. These panes are the only things inside a page that may scroll."
        >
          <WorkingSurfaceSample />
          <ul className="divide-y divide-border rounded-md border border-border">
            {SURFACE_PROPS.map((prop) => (
              <li
                key={prop.name}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4"
              >
                <span className="w-28 shrink-0 font-mono text-sm">
                  {prop.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {prop.use}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </DetailPage>
  );
}
