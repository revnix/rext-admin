/**
 * A person's initials for an avatar without a photo: the first letters of the first two words of
 * their name, upper case ("Sam Rivera" → "SR", "Lena" → "L"), or "?" without a name. Every
 * avatar uses this one rule, so the same person shows the same letters everywhere.
 */
export function initials(name: string | null | undefined): string {
  const letters = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return letters || "?";
}
