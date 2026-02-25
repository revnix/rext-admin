export type MediaKind = "image" | "video" | "document" | "unknown";

export function getMediaKind(fileType: string | null | undefined): MediaKind {
  const normalized = (fileType ?? "").trim().toLowerCase();

  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("video/")) return "video";
  if (normalized.startsWith("application/") || normalized.startsWith("text/")) {
    return "document";
  }

  return "unknown";
}

export function isMediaKind(
  fileType: string | null | undefined,
  kind: Exclude<MediaKind, "unknown">,
): boolean {
  return getMediaKind(fileType) === kind;
}
