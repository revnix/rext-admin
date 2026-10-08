import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand-logo";
import { PageBand } from "@/components/layouts";
import { Button } from "@/components/ui/button";

/**
 * A legal page for a reader who isn't signed in: the wordmark, the two ways in, and the document
 * in the container it has inside the shell. No sidebar and no account menu: there is no account.
 */
export function SignedOutFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border pb-4">
        <PageBand>
          <div className="flex items-center justify-between gap-4">
            <Link href={"/login" as Route} aria-label="Rext AI: log in">
              {/* The mark alone on a phone: the wordmark and both ways in don't fit 390 px. */}
              <LogoMark className="h-7 sm:hidden" />
              <Logo className="hidden h-7 sm:block" />
            </Link>
            <nav aria-label="Account" className="flex items-center gap-2">
              <Button data-rec="show" asChild variant="ghost" size="sm">
                <Link href={"/login" as Route}>Log in</Link>
              </Button>
              <Button data-rec="show" asChild size="sm">
                <Link href={"/signup" as Route}>Create account</Link>
              </Button>
            </nav>
          </div>
        </PageBand>
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
