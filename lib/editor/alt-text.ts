/**
 * A description as an image's alt text can hold it (task 706). The editor writes an image to
 * Markdown as `![alt](address "alt")`: a square bracket ends the alt text there and a double quote
 * ends the title, and the image is then not read back as one. So they become round brackets and
 * single quotes, and line breaks become spaces.
 */
export function altTextFor(description: string): string {
  return description
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
