/**
 * Format a count number with 'k' suffix for thousands
 */
export const formatCount = (count?: number): string => {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * Format a count number with locale string
 */
export const formatCountLocale = (count?: number): string => {
  if (!count) return "0";
  return count.toLocaleString();
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date string to localized date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format date with custom options
 */
export const formatDateCustom = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  return new Date(dateString).toLocaleDateString("en-US", options);
};

/**
 * Truncate content with ellipsis
 */
export const truncateContent = (
  content: string,
  maxLength: number = 150
): string => {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
};

/**
 * Get file extension from filename or MIME type
 */
export const getFileExtension = (fileName: string, mimeType: string): string => {
  const extension = fileName.split(".").pop();
  if (extension) return extension.toUpperCase();

  // Fallback to MIME type
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("spreadsheet")) return "XLS";
  if (mimeType.includes("text")) return "TXT";
  return "FILE";
};
