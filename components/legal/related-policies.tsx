import type { Route } from "next";
import Link from "next/link";

const POLICIES: { href: Route; label: string }[] = [
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
            <Link href={policy.href} className="text-primary hover:underline">
              {policy.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
