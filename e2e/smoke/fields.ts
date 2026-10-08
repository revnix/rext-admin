import type { Page } from "@playwright/test";

/**
 * A form's field by the name it is sent under ("email", "password"). Not by a role: a password field has
 * none of its own. Not by its label either: the label's words are followed by "(required)" for screen
 * readers.
 */
export const field = (page: Page, name: string) =>
  page.locator(`input[name="${name}"]`);
