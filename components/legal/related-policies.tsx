import type { Route } from "next";
import Link from "next/link";

export const POLICIES: { href: Route; label: string }[] = [
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/subscription-terms", label: "Subscription terms" },
  { href: "/legal/refund-policy", label: "Refunds and cancellation" },
  { href: "/legal/privacy", label: "Privacy policy" },
];

/** A legal page's aside: the other legal pages. */
export function RelatedPolicies({ current }: { current: Route }) {
  return (
    <nav aria-labelledby="related-policies" className="space-y-2">
      <h2 id="related-policies" className="text-section text-foreground">
        Related policies
      </h2>
      <ul className="space-y-1 text-body">
        {POLICIES.filter((policy) => policy.href !== current).map((policy) => (
          <li key={policy.href}>
            <Link href={policy.href} className="link">
              {policy.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Under the forms before sign-in: the app's own policies, by their names. They are where the
 * app's analytics are described, and they open without an account (task 936). The sentence about
 * what creating an account agrees to is LegalAgreement's, and is not this.
 */
export function PolicyLinks() {
  return (
    <nav
      aria-label="The app's policies"
      className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-caption text-muted-foreground"
    >
      {POLICIES.map((policy) => (
        <Link
          key={policy.href}
          href={policy.href}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {policy.label}
        </Link>
      ))}
    </nav>
  );
}
