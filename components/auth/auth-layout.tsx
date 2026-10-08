import { Logo } from "@/components/brand-logo";
import { VisitorChatLink } from "@/components/support/visitor-chat-link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * The frame of the pages before sign-in: from 1024 px a raised panel with the wordmark and one
 * line about the product beside the form, under it the form alone with the wordmark above. The
 * accent stays on the form's primary button (design/app-language.md §2.1).
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      <div className="hidden flex-col items-center justify-center border-r border-border bg-surface-raised p-12 lg:flex">
        <div className="flex max-w-md flex-col items-center gap-8 text-center">
          <Logo className="h-9" />
          <div className="space-y-3">
            {/* The site's hero word for word (the website coordinator, 2026-10-07): one promise on both sides. */}
            <h2 className="font-display text-display text-foreground">
              SEO articles that show their work.
            </h2>
            <p className="text-body text-muted-foreground">
              Pick a keyword, approve the outline. Rext AI researches, writes in
              your voice, scores the draft and publishes to WordPress.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-8 pt-24 sm:pt-8">
        <div className="absolute top-6 left-6 lg:hidden">
          <Logo className="h-7" />
        </div>

        <div className="w-full max-w-[420px]">
          {children}
          <VisitorChatLink />
        </div>
      </div>
    </div>
  );
}
