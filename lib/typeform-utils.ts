/**
 * Screen-reader announcements for the Topic Builder's wizard.
 *
 * The file once held DOM animation helpers (shake, bounce, glow, confetti);
 * nothing used them, and the dashboard's motion is in lib/animations.ts.
 */

/**
 * Announces important changes to screen readers
 */
export const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
