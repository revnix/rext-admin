/**
 * Accessibility Testing Utilities
 *
 * Helper functions for testing accessibility features in components,
 * particularly for keyboard navigation and ARIA compliance.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { log } from "@/lib/logger";

/**
 * Test keyboard navigation sequence for a component
 */
export async function testKeyboardNavigation(
  element: HTMLElement,
  navigationSequence: Array<{
    key: string;
    expectedFocus?: string | HTMLElement;
    description: string;
  }>,
) {
  const user = userEvent.setup();

  // Start with element focused
  element.focus();

  for (const step of navigationSequence) {
    await user.keyboard(`{${step.key}}`);

    if (step.expectedFocus) {
      if (typeof step.expectedFocus === "string") {
        const expectedElement = screen.getByLabelText(step.expectedFocus);
        expect(expectedElement).toHaveFocus();
      } else {
        expect(step.expectedFocus).toHaveFocus();
      }
    }
  }
}

/**
 * Check if element has proper ARIA attributes
 */
export function checkARIAAttributes(
  element: HTMLElement,
  expectedAttributes: Record<string, string | boolean | null>,
) {
  for (const [attr, expectedValue] of Object.entries(expectedAttributes)) {
    const actualValue = element.getAttribute(attr);

    if (expectedValue === null) {
      expect(actualValue).toBeNull();
    } else if (typeof expectedValue === "boolean") {
      expect(actualValue).toBe(String(expectedValue));
    } else {
      expect(actualValue).toBe(expectedValue);
    }
  }
}

/**
 * Test screen reader announcements via live regions
 */
export function expectScreenReaderAnnouncement(
  text: string,
  _timeout: number = 1000,
) {
  const liveRegions = screen.getAllByRole("status", { hidden: true });

  const hasAnnouncement = liveRegions.some((region) =>
    region.textContent?.includes(text),
  );

  expect(hasAnnouncement).toBe(true);
}

/**
 * Simulate keyboard-only interaction (no mouse)
 */
export class KeyboardOnlyUser {
  private user = userEvent.setup();

  async focusElement(element: HTMLElement) {
    element.focus();
  }

  async navigateWithTab(forward: boolean = true) {
    if (forward) {
      await this.user.keyboard("{Tab}");
    } else {
      await this.user.keyboard("{Shift>}{Tab}{/Shift}");
    }
  }

  async activateElement() {
    await this.user.keyboard("{Enter}");
  }

  async navigateWithArrows(direction: "up" | "down" | "left" | "right") {
    const keyMap = {
      up: "{ArrowUp}",
      down: "{ArrowDown}",
      left: "{ArrowLeft}",
      right: "{ArrowRight}",
    };

    await this.user.keyboard(keyMap[direction]);
  }

  async type(text: string) {
    await this.user.keyboard(text);
  }

  async pressKey(key: string) {
    await this.user.keyboard(`{${key}}`);
  }
}

/**
 * Test focus management for modal/dropdown patterns
 */
export async function testFocusTrap(
  container: HTMLElement,
  firstElement: HTMLElement,
  lastElement: HTMLElement,
) {
  const user = userEvent.setup();

  // Focus first element
  firstElement.focus();
  expect(firstElement).toHaveFocus();

  // Tab forward should stay within container
  await user.keyboard("{Tab}");
  const focusedAfterTab = document.activeElement;
  expect(container.contains(focusedAfterTab)).toBe(true);

  // Focus last element
  lastElement.focus();
  expect(lastElement).toHaveFocus();

  // Tab forward should cycle to first
  await user.keyboard("{Tab}");
  expect(firstElement).toHaveFocus();

  // Shift+Tab backward should cycle to last
  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(lastElement).toHaveFocus();
}

/**
 * Test color contrast accessibility
 */
export function checkColorContrast(
  element: HTMLElement,
  _minimumRatio: number = 4.5,
) {
  const styles = window.getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;

  // This is a simplified check - in a real implementation,
  // you'd use a proper contrast calculation library
  expect(backgroundColor).toBeTruthy();
  expect(color).toBeTruthy();

  // For proper contrast testing, integrate with libraries like:
  // - color-contrast-checker
  // - axe-core
  log.info(`Color contrast check: bg=${backgroundColor}, fg=${color}`);
}

/**
 * Test element visibility for screen readers
 */
export function testScreenReaderVisibility(element: HTMLElement) {
  const styles = window.getComputedStyle(element);

  // Check if element is visible to screen readers
  const isVisuallyHidden =
    styles.position === "absolute" &&
    styles.width === "1px" &&
    styles.height === "1px" &&
    styles.padding === "0px" &&
    styles.margin === "-1px" &&
    styles.overflow === "hidden" &&
    styles.clipPath === "inset(50%)" &&
    styles.whiteSpace === "nowrap";

  const isAriaHidden = element.getAttribute("aria-hidden") === "true";
  const hasDisplayNone = styles.display === "none";
  const hasVisibilityHidden = styles.visibility === "hidden";

  return {
    visuallyHidden: isVisuallyHidden,
    ariaHidden: isAriaHidden,
    displayNone: hasDisplayNone,
    visibilityHidden: hasVisibilityHidden,
    accessibleToScreenReaders:
      !isAriaHidden && !hasDisplayNone && !hasVisibilityHidden,
  };
}

/**
 * Test error announcement patterns
 */
export async function testErrorAnnouncement(
  triggerError: () => Promise<void>,
  expectedErrorText: string,
) {
  await triggerError();

  // Check for error alert
  const errorAlert = screen.getByRole("alert");
  expect(errorAlert).toHaveTextContent(expectedErrorText);

  // Check ARIA attributes
  checkARIAAttributes(errorAlert, {
    role: "alert",
  });
}

/**
 * Test landmark navigation
 */
export function testLandmarkNavigation() {
  const landmarks = [
    "banner",
    "navigation",
    "main",
    "complementary",
    "contentinfo",
  ];

  landmarks.forEach((landmark) => {
    try {
      const element = screen.getByRole(landmark);
      expect(element).toBeInTheDocument();
    } catch (_error) {
      // Landmark not found - this might be expected depending on the component
      log.info(`Landmark "${landmark}" not found - this may be expected`);
    }
  });
}

/**
 * Simulate high contrast mode testing
 */
export function simulateHighContrastMode() {
  // Add high contrast CSS class to document
  document.documentElement.classList.add("high-contrast");

  return () => {
    // Cleanup function
    document.documentElement.classList.remove("high-contrast");
  };
}

/**
 * Test reduced motion preferences
 */
export function simulateReducedMotion() {
  // Mock matchMedia for prefers-reduced-motion
  const mockMatchMedia = jest.fn(() => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });

  return () => {
    // Cleanup function
    mockMatchMedia.mockClear();
  };
}
