/**
 * A client page's tab title (task 809): "<page> · Rext AI", the same shape as the root layout's
 * template, and never the old "Rext AI Admin".
 */
import { renderHook } from "@testing-library/react";
import { usePageTitle } from "@/hooks/use-page-title";

it("names the page, then the product", () => {
  renderHook(() => usePageTitle("Calendar", "Your publishing calendar."));

  expect(document.title).toBe("Calendar · Rext AI");
  expect(
    document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content"),
  ).toBe("Calendar · Rext AI");
  expect(
    document.querySelector('meta[name="description"]')?.getAttribute("content"),
  ).toBe("Your publishing calendar.");
  expect(document.title).not.toMatch(/Admin/);
});
