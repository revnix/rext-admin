import type {
  KnowledgeDuplicateGroup,
  KnowledgeDuplicateReason,
  UnifiedKnowledgeItem,
} from "@/types/knowledge";

const DUPLICATE_THRESHOLD_CONTENT_LENGTH = 160;

const normaliseWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const normaliseUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    const normalizedPath = pathname || "/";
    const search = parsed.search ? parsed.search : "";
    return `${parsed.hostname.toLowerCase()}${normalizedPath}${search}`;
  } catch {
    // Fall back to manual normalization for non-standard URLs
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
};

const normaliseTitle = (title?: string | null): string | null => {
  if (!title || typeof title !== "string") {
    return null;
  }

  const normalized = normaliseWhitespace(title).toLowerCase();
  return normalized || null;
};

const extractContent = (item: UnifiedKnowledgeItem): string | null => {
  if (item.preview) {
    return item.preview;
  }

  if (item.source && typeof item.source === "object") {
    if ("content" in item.source && typeof item.source.content === "string") {
      return item.source.content;
    }

    if (
      "metadata" in item.source &&
      item.source.metadata &&
      typeof item.source.metadata === "object"
    ) {
      const metadata = item.source.metadata as Record<string, unknown>;
      const metadataContent = metadata.content;
      if (typeof metadataContent === "string") {
        return metadataContent;
      }
    }
  }

  return null;
};

const normaliseContent = (content?: string | null): string | null => {
  if (!content || typeof content !== "string") {
    return null;
  }

  const normalized = normaliseWhitespace(content).toLowerCase();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, DUPLICATE_THRESHOLD_CONTENT_LENGTH);
};

const pushGroup = (
  groups: KnowledgeDuplicateGroup[],
  reason: KnowledgeDuplicateReason,
  signature: string,
  items: UnifiedKnowledgeItem[],
) => {
  if (items.length < 2) {
    return;
  }

  groups.push({
    reason,
    signature,
    items: [...items],
  });
};

export const findKnowledgeDuplicates = (
  items: UnifiedKnowledgeItem[],
): KnowledgeDuplicateGroup[] => {
  const groups: KnowledgeDuplicateGroup[] = [];
  const urlMap = new Map<string, UnifiedKnowledgeItem[]>();
  const titleMap = new Map<string, UnifiedKnowledgeItem[]>();
  const contentMap = new Map<string, UnifiedKnowledgeItem[]>();

  items.forEach((item) => {
    const urlSignature = normaliseUrl(item.url);
    if (urlSignature) {
      const records = urlMap.get(urlSignature) ?? [];
      records.push(item);
      urlMap.set(urlSignature, records);
    }

    const titleSignature = normaliseTitle(item.title);
    if (titleSignature) {
      const records = titleMap.get(titleSignature) ?? [];
      records.push(item);
      titleMap.set(titleSignature, records);
    }

    const rawContent = extractContent(item);
    const contentSignature = normaliseContent(rawContent);
    if (contentSignature) {
      const records = contentMap.get(contentSignature) ?? [];
      records.push(item);
      contentMap.set(contentSignature, records);
    }
  });

  urlMap.forEach((records, signature) => {
    pushGroup(groups, "url", signature, records);
  });
  titleMap.forEach((records, signature) => {
    pushGroup(groups, "title", signature, records);
  });
  contentMap.forEach((records, signature) => {
    pushGroup(groups, "content", signature, records);
  });

  return groups;
};

export const buildDuplicateReasonIndex = (
  groups: KnowledgeDuplicateGroup[],
): Record<string, KnowledgeDuplicateReason[]> => {
  return groups.reduce<Record<string, KnowledgeDuplicateReason[]>>(
    (accumulator, group) => {
      group.items.forEach((item) => {
        const reasons = accumulator[item.id] ?? [];
        if (!reasons.includes(group.reason)) {
          reasons.push(group.reason);
        }
        accumulator[item.id] = reasons;
      });
      return accumulator;
    },
    {},
  );
};
