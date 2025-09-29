"use client";

import {
  AlertTriangle,
  AlignLeft,
  Link as LinkIcon,
  Type as TitleIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  KnowledgeDuplicateGroup,
  KnowledgeDuplicateReason,
} from "@/types/knowledge";
import type { KnowledgeType } from "@/types/workspace";

const REASON_META: Record<
  KnowledgeDuplicateReason,
  {
    label: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
  }
> = {
  url: {
    label: "Matching URL",
    description:
      "Items share the same normalized URL and may point to identical content.",
    icon: LinkIcon,
  },
  title: {
    label: "Matching Title",
    description:
      "Items use the same title, which can indicate redundant entries across sources.",
    icon: TitleIcon,
  },
  content: {
    label: "Similar Content",
    description:
      "Items begin with the same content snippet. Verify to avoid maintaining duplicates.",
    icon: AlignLeft,
  },
};

const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  web: "Web",
  file: "File",
  text: "Text",
};

const formatSignaturePreview = (
  reason: KnowledgeDuplicateReason,
  signature: string,
) => {
  if (!signature) {
    return "";
  }

  if (reason === "content") {
    return signature.length > 120 ? `${signature.slice(0, 120)}…` : signature;
  }

  if (reason === "title" && signature.length > 80) {
    return `${signature.slice(0, 80)}…`;
  }

  return signature.length > 140 ? `${signature.slice(0, 140)}…` : signature;
};

const groupByReason = (groups: KnowledgeDuplicateGroup[]) =>
  groups.reduce<Record<KnowledgeDuplicateReason, KnowledgeDuplicateGroup[]>>(
    (accumulator, group) => {
      const existing = accumulator[group.reason] ?? [];
      existing.push(group);
      accumulator[group.reason] = existing;
      return accumulator;
    },
    { url: [], title: [], content: [] },
  );

interface KnowledgeDuplicateSummaryProps {
  groups: KnowledgeDuplicateGroup[];
}

export function KnowledgeDuplicateSummary({
  groups,
}: KnowledgeDuplicateSummaryProps) {
  if (groups.length === 0) {
    return null;
  }

  const grouped = groupByReason(groups);
  const reasonsWithGroups = (
    Object.keys(grouped) as KnowledgeDuplicateReason[]
  ).filter((reason) => grouped[reason].length > 0);

  return (
    <Card className="border-amber-400 bg-amber-50/70 dark:border-amber-300 dark:bg-amber-900/20">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle className="text-base font-semibold">
            Potential duplicate knowledge detected
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-amber-700 dark:text-amber-200">
          Review the groups below to consolidate overlapping knowledge items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reasonsWithGroups.map((reason) => {
          const reasonGroups = grouped[reason];
          const ReasonIcon = REASON_META[reason].icon;

          return (
            <div key={reason} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                  <ReasonIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-100">
                    {REASON_META[reason].label}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    {REASON_META[reason].description}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-amber-200 bg-white/80 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                {reasonGroups.map((group) => (
                  <div
                    key={`${reason}-${group.signature}`}
                    className="space-y-2 rounded-md border border-amber-200/70 p-3 dark:border-amber-800/60"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-200">
                      Shared signature
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-100">
                      {formatSignaturePreview(reason, group.signature)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <Badge
                          key={item.id}
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100"
                        >
                          {KNOWLEDGE_TYPE_LABELS[item.type]} · {item.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
