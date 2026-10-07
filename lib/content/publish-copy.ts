import type { WordPressPostStatus } from "@/types/content";

/**
 * What the article's Publish menu says, per WordPress status (#676). A site holds one post per
 * article, and every choice in the menu sets that post's status: on an article that is live, "Save as
 * Draft" and "Submit for Review" take the live post down. The confirm says so in the destructive style,
 * and its buttons name both choices (design/app-language.md §6).
 */
export type PublishConfirmCopy = {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "destructive";
};

export function publishConfirmCopy(
  status: WordPressPostStatus,
  isLive: boolean,
): PublishConfirmCopy {
  if (status === "publish") {
    return isLive
      ? {
          title: "Update the live post?",
          description:
            "The post on your site is replaced with this version of the article.",
          confirmText: "Update post",
          cancelText: "Cancel",
          variant: "default",
        }
      : {
          title: "Publish this article?",
          description: "It goes live on your connected site as a post.",
          confirmText: "Publish article",
          cancelText: "Cancel",
          variant: "default",
        };
  }
  if (isLive) {
    return status === "draft"
      ? {
          title: "Take the post down from your site?",
          description:
            "The live post becomes a draft and leaves your site until you publish it again. The article here doesn't change.",
          confirmText: "Take the post down",
          cancelText: "Keep it live",
          variant: "destructive",
        }
      : {
          title: "Take the post down for review?",
          description:
            "The live post leaves your site and waits there for an editor's review until it's published again. The article here doesn't change.",
          confirmText: "Take the post down",
          cancelText: "Keep it live",
          variant: "destructive",
        };
  }
  return status === "draft"
    ? {
        title: "Save as a draft on your site?",
        description:
          "Your connected site gets the article as a draft post, which only its editors can see.",
        confirmText: "Save as draft",
        cancelText: "Cancel",
        variant: "default",
      }
    : {
        title: "Submit for review on your site?",
        description:
          "Your connected site gets the article as a post waiting for review; an editor there publishes it.",
        confirmText: "Submit for review",
        cancelText: "Cancel",
        variant: "default",
      };
}

/** The publish flow's titles and results, in sentence case. */
export const PUBLISH_RESULT_COPY: Record<
  WordPressPostStatus,
  { working: string; successTitle: string; successMessage: string }
> = {
  publish: {
    working: "Publishing the article",
    successTitle: "The article is live",
    successMessage: "It's published on your site.",
  },
  draft: {
    working: "Saving the draft",
    successTitle: "Saved as a draft on your site",
    successMessage: "Only your site's editors can see it until it's published.",
  },
  pending: {
    working: "Submitting for review",
    successTitle: "Submitted for review",
    successMessage: "It waits on your site for an editor to publish it.",
  },
};

/** The live post's address when it's a web address; anything else (a script URL) is never a link. */
export function postLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
