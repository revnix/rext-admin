"use client";

import type { Route } from "next";
import Link from "next/link";
import { DetailPage } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

/**
 * Where Lemon Squeezy's checkout returns when it's left before paying (plans/app/F-billing.md F7),
 * inside the shell: nothing was charged, the plan is unchanged, and the plans are one click away.
 */
export default function CheckoutCancelPage() {
  return (
    <DetailPage
      title="Checkout cancelled"
      description="Nothing was charged, and your plan hasn't changed."
      actions={
        <>
          <Button data-rec="show" asChild variant="outline">
            <Link href={"/" as Route}>Go to home</Link>
          </Button>
          <Button data-rec="show" asChild>
            <Link href={"/pricing" as Route}>See the plans</Link>
          </Button>
        </>
      }
    >
      <Notice title="Something went wrong at checkout?">
        Write to{" "}
        <a
          href="mailto:contact@rext.ai?subject=Checkout"
          className="font-medium text-foreground underline underline-offset-4"
        >
          contact@rext.ai
        </a>{" "}
        and we'll help you finish it.
      </Notice>
    </DetailPage>
  );
}
