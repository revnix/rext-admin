import type {
  KnowledgeAnalyticsSummary,
  KnowledgeAnalyticsTotals,
  KnowledgeStatusMetric,
  KnowledgeTypeMetric,
  UnifiedKnowledgeItem,
  UnifiedKnowledgeStatus,
} from "@/types/knowledge";
import type {
  FileKnowledge,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";

interface BaseAggregationArgs {
  workspaceId: string;
  webItems?: WebKnowledge[];
  fileItems?: FileKnowledge[];
  textItems?: TextKnowledge[];
}

interface AnalyticsArgs extends BaseAggregationArgs {
  maxRecentItems?: number;
}

const DEFAULT_RECENT_ITEMS = 5;
const COMPLETED_STATUSES: UnifiedKnowledgeStatus[] = ["completed"];
const FAILED_STATUSES: UnifiedKnowledgeStatus[] = ["failed"];
const IN_PROGRESS_STATUSES: UnifiedKnowledgeStatus[] = [
  "pending",
  "scraping",
  "processing",
  "uploading",
];

const safeNumber = (value: unknown): number => {
  if (typeof value !== "number") {
    return 0;
  }
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const parseDate = (value?: string | null): number => {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const resolveFileName = (file: FileKnowledge): string => {
  if ("file_name" in file && typeof file.file_name === "string") {
    return file.file_name;
  }
  return file.name;
};

const normalizeStatus = (
  status: UnifiedKnowledgeStatus | undefined,
): UnifiedKnowledgeStatus => {
  if (!status) {
    return "completed";
  }
  return status;
};

const collectWordCount = (item: UnifiedKnowledgeItem): number => {
  if (typeof item.wordCount === "number") {
    return safeNumber(item.wordCount);
  }

  const source = item.source as {
    word_count?: number | null;
    char_count?: number | null;
  };
  return safeNumber(source?.word_count);
};

const collectCharCount = (item: UnifiedKnowledgeItem): number => {
  if (typeof item.charCount === "number") {
    return safeNumber(item.charCount);
  }

  const source = item.source as {
    char_count?: number | null;
  };
  return safeNumber(source?.char_count);
};

export const buildUnifiedKnowledgeItems = ({
  workspaceId,
  webItems = [],
  fileItems = [],
  textItems = [],
}: BaseAggregationArgs): UnifiedKnowledgeItem[] => {
  const unified: UnifiedKnowledgeItem[] = [];

  webItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      unified.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "web",
        title: item.title || item.url || "Untitled",
        subtitle: item.url,
        url: item.url,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: item.content,
        source: item,
      });
    });

  fileItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      unified.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "file",
        title: resolveFileName(item) || "Untitled File",
        subtitle: item.type,
        status: item.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: item.content,
        source: item,
      });
    });

  textItems
    .filter((item) => item.workspace_id === workspaceId)
    .forEach((item) => {
      unified.push({
        id: item.id,
        workspaceId: item.workspace_id,
        type: "text",
        title: item.title || "Untitled Note",
        subtitle: item.tags?.join(", "),
        status: (item as unknown as { status?: UnifiedKnowledgeStatus })
          ?.status,
        wordCount: item.word_count,
        charCount: item.char_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        preview: item.content,
        source: item,
      });
    });

  return unified;
};

const calculateTotals = (
  items: UnifiedKnowledgeItem[],
): KnowledgeAnalyticsTotals => {
  if (items.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      failedItems: 0,
      completionRate: 0,
      totalWordCount: 0,
      averageWordCount: null,
      totalCharCount: 0,
      averageCharCount: null,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let failed = 0;
  let wordSum = 0;
  let wordCountItems = 0;
  let charSum = 0;
  let charCountItems = 0;

  items.forEach((item) => {
    const status = normalizeStatus(item.status);

    if (COMPLETED_STATUSES.includes(status)) {
      completed += 1;
    } else if (FAILED_STATUSES.includes(status)) {
      failed += 1;
    } else if (IN_PROGRESS_STATUSES.includes(status)) {
      inProgress += 1;
    }

    const wordCount = collectWordCount(item);
    if (wordCount > 0) {
      wordSum += wordCount;
      wordCountItems += 1;
    }

    const charCount = collectCharCount(item);
    if (charCount > 0) {
      charSum += charCount;
      charCountItems += 1;
    }
  });

  const totalItems = items.length;

  return {
    totalItems,
    completedItems: completed,
    inProgressItems: inProgress,
    failedItems: failed,
    completionRate: totalItems > 0 ? completed / totalItems : 0,
    totalWordCount: wordSum,
    averageWordCount:
      wordCountItems > 0 ? Math.round(wordSum / wordCountItems) : null,
    totalCharCount: charSum,
    averageCharCount:
      charCountItems > 0 ? Math.round(charSum / charCountItems) : null,
  };
};

const calculateStatusMetrics = (
  items: UnifiedKnowledgeItem[],
): KnowledgeStatusMetric[] => {
  const total = items.length;
  if (total === 0) {
    return [];
  }

  const counts = new Map<UnifiedKnowledgeStatus, number>();

  items.forEach((item) => {
    const status = normalizeStatus(item.status);
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

const calculateTypeMetrics = (
  items: UnifiedKnowledgeItem[],
): KnowledgeTypeMetric[] => {
  const total = items.length;
  if (total === 0) {
    return [];
  }

  const counts = new Map<KnowledgeType, number>();

  items.forEach((item) => {
    counts.set(item.type, (counts.get(item.type) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

const collectRecentItems = (
  items: UnifiedKnowledgeItem[],
  limit: number,
): UnifiedKnowledgeItem[] => {
  if (items.length === 0) {
    return [];
  }

  return [...items]
    .sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt))
    .slice(0, Math.max(limit, 0));
};

const resolveUpdatedAt = (
  items: UnifiedKnowledgeItem[],
): string | undefined => {
  const latest = items.reduce<number>((acc, item) => {
    const createdTs = parseDate(item.createdAt);
    const updatedTs = item.updatedAt ? parseDate(item.updatedAt) : 0;
    return Math.max(acc, createdTs, updatedTs);
  }, 0);

  if (latest === 0) {
    return undefined;
  }

  return new Date(latest).toISOString();
};

export const buildKnowledgeAnalyticsSummary = ({
  workspaceId,
  webItems,
  fileItems,
  textItems,
  maxRecentItems = DEFAULT_RECENT_ITEMS,
}: AnalyticsArgs): KnowledgeAnalyticsSummary => {
  const unifiedItems = buildUnifiedKnowledgeItems({
    workspaceId,
    webItems,
    fileItems,
    textItems,
  });

  const totals = calculateTotals(unifiedItems);
  const statusMetrics = calculateStatusMetrics(unifiedItems);
  const typeMetrics = calculateTypeMetrics(unifiedItems);
  const recentItems = collectRecentItems(unifiedItems, maxRecentItems);
  const updatedAt = resolveUpdatedAt(unifiedItems);

  return {
    totals,
    statusMetrics,
    typeMetrics,
    recentItems,
    updatedAt,
  };
};

export type { AnalyticsArgs as KnowledgeAnalyticsArgs };
