import { BrandLogo } from "@/components/brand-logo";

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
          <BrandLogo width={150} height={50} className="object-contain" />
          <div className="space-y-3">
            <h2 className="font-display text-display text-foreground">
              Speedy, easy and fast content generation.
            </h2>
            <p className="text-body text-muted-foreground">
              Rext AI helps you set content goals, earn organic traffic, and
              scale your publishing workflow up to 10x faster.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-8 pt-24 sm:pt-8">
        <div className="absolute top-6 left-6 lg:hidden">
          <BrandLogo width={90} height={28} />
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
