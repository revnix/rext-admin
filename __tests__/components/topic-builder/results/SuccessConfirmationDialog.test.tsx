/**
 * Comprehensive Tests for SuccessConfirmationDialog Component
 * Covers success messaging display, navigation actions, accessibility features, and user interactions
 */

import { SuccessConfirmationDialog } from "@/components/topic-builder/results/SuccessConfirmationDialog";
import userEvent from "@testing-library/user-event";
import { render, screen } from "../../../utils/test-utils";

interface MockIconProps {
  className?: string;
  [key: string]: unknown;
}

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  CheckCircle: ({ className, ...props }: MockIconProps) => (
    <div data-testid="check-circle-icon" className={className} {...props} />
  ),
  FileText: ({ className, ...props }: MockIconProps) => (
    <div data-testid="file-text-icon" className={className} {...props} />
  ),
  Plus: ({ className, ...props }: MockIconProps) => (
    <div data-testid="plus-icon" className={className} {...props} />
  ),
}));

describe("SuccessConfirmationDialog Component", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    topicTitle: "How to Build React Apps",
    onNavigateToTopics: jest.fn(),
    onGenerateNew: jest.fn(),
  };

  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Dialog Rendering and Message Content", () => {
    it("should render dialog when open is true", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText("Topic Saved Successfully!")).toBeInTheDocument();
    });

    it("should not render dialog when open is false", () => {
      render(<SuccessConfirmationDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Topic Saved Successfully!"),
      ).not.toBeInTheDocument();
    });

    it("should display the correct topic title in success message", () => {
      const customTitle = "Advanced JavaScript Patterns";
      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          topicTitle={customTitle}
        />,
      );

      expect(
        screen.getByText(
          `"${customTitle}" has been saved to your topics library. What would you like to do next? Use the Tab key to navigate between options and Enter or Space to select.`,
        ),
      ).toBeInTheDocument();
    });

    it("should display success header with checkmark icon", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("Topic Saved Successfully!")).toBeInTheDocument();
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      const customClass = "custom-dialog-class";
      render(
        <SuccessConfirmationDialog {...defaultProps} className={customClass} />,
      );

      const dialog = screen.getByRole("alertdialog");
      expect(dialog.closest('[class*="max-w-md"]')).toHaveClass(customClass);
    });

    it("should display all three action buttons", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("Stay Here")).toBeInTheDocument();
      expect(screen.getByText("View All Topics")).toBeInTheDocument();
      expect(screen.getByText("Generate New Topics")).toBeInTheDocument();
    });

    it("should display keyboard navigation hint in description", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(
        screen.getByText(
          /Use the Tab key to navigate between options and Enter or Space to select/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Navigation Button Actions", () => {
    it("should call onOpenChange(false) when 'Stay Here' is clicked", async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onOpenChange={mockOnOpenChange}
        />,
      );

      await user.click(screen.getByText("Stay Here"));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onNavigateToTopicsand close dialog when 'View All Topics' is clicked", async () => {
      const user = userEvent.setup();
      const mockOnNavigateToTopics = jest.fn();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onNavigateToTopics={mockOnNavigateToTopics}
          onOpenChange={mockOnOpenChange}
        />,
      );

      await user.click(screen.getByText("View All Topics"));

      expect(mockOnNavigateToTopics).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(consoleSpy).toHaveBeenCalledWith("Navigating to topics page");
    });

    it("should call onGenerateNew and close dialog when 'Generate New Topics' is clicked", async () => {
      const user = userEvent.setup();
      const mockOnGenerateNew = jest.fn();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onGenerateNew={mockOnGenerateNew}
          onOpenChange={mockOnOpenChange}
        />,
      );

      await user.click(screen.getByText("Generate New Topics"));

      expect(mockOnGenerateNew).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(consoleSpy).toHaveBeenCalledWith("Starting new topic generation");
    });

    it("should display correct icons for navigation buttons", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      // Check if icons are present in the buttons
      const viewAllButton = screen
        .getByText("View All Topics")
        .closest("button");
      const generateNewButton = screen
        .getByText("Generate New Topics")
        .closest("button");

      expect(viewAllButton).toContainElement(
        screen.getByTestId("file-text-icon"),
      );
      expect(generateNewButton).toContainElement(
        screen.getByTestId("plus-icon"),
      );
    });

    it("should handle multiple rapid clicks gracefully", async () => {
      const user = userEvent.setup();
      const mockOnNavigateToTopics = jest.fn();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onNavigateToTopics={mockOnNavigateToTopics}
          onOpenChange={mockOnOpenChange}
        />,
      );

      const button = screen.getByText("View All Topics");

      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should still work properly
      expect(mockOnNavigateToTopics).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Accessibility Features", () => {
    it("should have proper ARIA roles and labels", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Topic Saved Successfully!" }),
      ).toBeInTheDocument();
    });

    it("should have aria-hidden attributes on decorative icons", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const checkIcon = screen.getByTestId("check-circle-icon");
      const fileIcon = screen.getByTestId("file-text-icon");
      const plusIcon = screen.getByTestId("plus-icon");

      expect(checkIcon).toHaveAttribute("aria-hidden", "true");
      expect(fileIcon).toHaveAttribute("aria-hidden", "true");
      expect(plusIcon).toHaveAttribute("aria-hidden", "true");
    });

    it("should have aria-describedby attributes on action buttons", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const stayHereButton = screen.getByText("Stay Here");
      const viewAllButton = screen.getByText("View All Topics");
      const generateNewButton = screen.getByText("Generate New Topics");

      expect(stayHereButton).toHaveAttribute(
        "aria-describedby",
        "stay-here-description",
      );
      expect(viewAllButton).toHaveAttribute(
        "aria-describedby",
        "navigate-to-topics-description",
      );
      expect(generateNewButton).toHaveAttribute(
        "aria-describedby",
        "generate-new-description",
      );
    });

    it("should have screen reader descriptions in the DOM", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      expect(
        screen.getByText(
          "Close this dialog and remain on the current topic generation page",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Navigate to the Topicspage to view and manage all your saved topics",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Start a new topic generation session to create more content topics",
        ),
      ).toBeInTheDocument();
    });

    it("should have screen reader descriptions with sr-only class", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const screenReaderSection = screen
        .getByText(
          "Close this dialog and remain on the current topic generation page",
        )
        .closest("div");
      expect(screenReaderSection?.parentElement).toHaveClass("sr-only");
    });

    it("should have proper heading structure", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const heading = screen.getByRole("heading");
      expect(heading).toHaveTextContent("Topic Saved Successfully!");
      expect(heading).toHaveClass("text-left");
    });

    it("should maintain focus management when dialog opens", () => {
      const { rerender } = render(
        <SuccessConfirmationDialog {...defaultProps} open={false} />,
      );

      // Dialog should not be present when closed
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

      // Open the dialog
      rerender(<SuccessConfirmationDialog {...defaultProps} open={true} />);

      // Dialog should be present and focusable
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle Enter key on buttons", async () => {
      const user = userEvent.setup();
      const mockOnNavigateToTopics = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onNavigateToTopics={mockOnNavigateToTopics}
        />,
      );

      const button = screen.getByText("View All Topics");
      button.focus();
      await user.keyboard("{Enter}");

      expect(mockOnNavigateToTopics).toHaveBeenCalled();
    });

    it("should handle Space key on buttons", async () => {
      const user = userEvent.setup();
      const mockOnGenerateNew = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onGenerateNew={mockOnGenerateNew}
        />,
      );

      const button = screen.getByText("Generate New Topics");
      button.focus();
      await user.keyboard(" ");

      expect(mockOnGenerateNew).toHaveBeenCalled();
    });

    it("should handle Tab key navigation between buttons", async () => {
      const user = userEvent.setup();
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const stayHereButton = screen.getByText("Stay Here");
      const viewAllButton = screen.getByText("View All Topics");
      const generateNewButton = screen.getByText("Generate New Topics");

      // Start from first button
      stayHereButton.focus();
      expect(stayHereButton).toHaveFocus();

      // Tab to next button
      await user.keyboard("{Tab}");
      expect(viewAllButton).toHaveFocus();

      // Tab to next button
      await user.keyboard("{Tab}");
      expect(generateNewButton).toHaveFocus();
    });

    it("should handle Escape key to close dialog", async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onOpenChange={mockOnOpenChange}
        />,
      );

      await user.keyboard("{Escape}");

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should be keyboard accessible for all interactive elements", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const buttons = screen.getAllByRole("button");

      // All buttons should be focusable
      buttons.forEach((button: HTMLElement) => {
        expect(button).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty topic title gracefully", () => {
      render(<SuccessConfirmationDialog {...defaultProps} topicTitle="" />);

      expect(screen.getByText("Topic Saved Successfully!")).toBeInTheDocument();
      expect(
        screen.getByText(/has been saved to your topics library/),
      ).toBeInTheDocument();
    });

    it("should handle very long topic titles", () => {
      const longTitle =
        "This is a very long topic title that might cause layout issues if not handled properly in the UI component";

      render(
        <SuccessConfirmationDialog {...defaultProps} topicTitle={longTitle} />,
      );

      expect(
        screen.getByText(
          `"${longTitle}" has been saved to your topics library. What would you like to do next? Use the Tab key to navigate between options and Enter or Space to select.`,
        ),
      ).toBeInTheDocument();
    });

    it("should handle special characters in topic title", () => {
      const specialTitle = "How to Use <React> & {JavaScript} in 2024!";

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          topicTitle={specialTitle}
        />,
      );

      expect(
        screen.getByText(
          `"${specialTitle}" has been saved to your topics library. What would you like to do next? Use the Tab key to navigate between options and Enter or Space to select.`,
        ),
      ).toBeInTheDocument();
    });

    it("should handle missing callback functions gracefully", async () => {
      const user = userEvent.setup();

      render(
        <SuccessConfirmationDialog
          open={true}
          onOpenChange={jest.fn()}
          topicTitle="Test Topic"
          onNavigateToTopics={() => {}}
          onGenerateNew={() => {}}
        />,
      );

      // Should not throw errors when clicking buttons
      await user.click(screen.getByText("View All Topics"));
      await user.click(screen.getByText("Generate New Topics"));
      await user.click(screen.getByText("Stay Here"));

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("should handle component unmounting gracefully", () => {
      const { unmount } = render(
        <SuccessConfirmationDialog {...defaultProps} />,
      );

      expect(() => unmount()).not.toThrow();
    });

    it("should maintain proper button styling", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const stayHereButton = screen.getByText("Stay Here");
      const viewAllButton = screen.getByText("View All Topics");
      const generateNewButton = screen.getByText("Generate New Topics");

      // Stay Here should be a cancel button (different styling)
      expect(stayHereButton.closest("button")).toHaveClass("sm:mr-auto");

      // View All Topics should have secondary styling
      expect(viewAllButton.closest("button")).toHaveClass(
        "bg-secondary",
        "text-secondary-foreground",
      );

      // Generate New Topics should have default action styling
      expect(generateNewButton.closest("button")).toHaveClass("gap-2");
    });

    it("should have proper button layout with gaps", () => {
      render(<SuccessConfirmationDialog {...defaultProps} />);

      const footer = screen.getByText("Stay Here").closest('[class*="gap-3"]');
      expect(footer).toHaveClass("gap-3", "sm:gap-2");
    });
  });

  describe("Console Logging", () => {
    it("should log navigation action", async () => {
      const user = userEvent.setup();
      render(<SuccessConfirmationDialog {...defaultProps} />);

      await user.click(screen.getByText("View All Topics"));

      expect(consoleSpy).toHaveBeenCalledWith("Navigating to topics page");
    });

    it("should log generate new action", async () => {
      const user = userEvent.setup();
      render(<SuccessConfirmationDialog {...defaultProps} />);

      await user.click(screen.getByText("Generate New Topics"));

      expect(consoleSpy).toHaveBeenCalledWith("Starting new topic generation");
    });

    it("should not log for Stay Here action", async () => {
      const user = userEvent.setup();
      render(<SuccessConfirmationDialog {...defaultProps} />);

      await user.click(screen.getByText("Stay Here"));

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("Dialog State Management", () => {
    it("should respect open prop changes", () => {
      const { rerender } = render(
        <SuccessConfirmationDialog {...defaultProps} open={true} />,
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();

      rerender(<SuccessConfirmationDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should call onOpenChange with correct values", async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();

      render(
        <SuccessConfirmationDialog
          {...defaultProps}
          onOpenChange={mockOnOpenChange}
        />,
      );

      // Test various ways to close the dialog
      await user.click(screen.getByText("Stay Here"));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);

      mockOnOpenChange.mockClear();

      await user.click(screen.getByText("View All Topics"));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);

      mockOnOpenChange.mockClear();

      await user.click(screen.getByText("Generate New Topics"));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
