"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Footer, SubscriptionAgreement } from "@/components/layout/footer";
import { PricingTable } from "@/components/pricing/pricing-table";
import { TrialStatusBanner } from "@/components/subscription/trial-status-banner";
import {
  SecurityBanner,
  SecurityIndicators,
} from "@/components/ui/security-badge";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { SubscriptionPlan } from "@/types/subscription";
import {
  PRICING_FAQ_ITEMS,
  PRICING_SUPPORT_LINKS,
} from "@/config/pricing-content";

/**
 * Pricing Page
 *
 * Public-facing pricing page that displays all available subscription plans.
 *
 * Features:
 * - Displays all active, public subscription plans
 * - Monthly/yearly billing toggle
 * - Shows trial status banner for logged-in users
 * - Integrates with PricingTable component
 * - Handles checkout flow
 * - SEO optimized with metadata
 */

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchSubscription } = useSubscriptionStore();
  const { status } = useSession();

  useEffect(() => {
    // Fetch subscription only for signed-in visitors. The ungated call fired
    // the 3-endpoint burst (plus token-refresh retries) as guaranteed 401s
    // for anonymous users (finding #23, verified at runtime).
    if (status === "authenticated") {
      fetchSubscription();
    }
  }, [status, fetchSubscription]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await apiClient.subscriptions.getPlans();

        if (response.plans) {
          // Filter active public plans and sort by price
          const activePlans = response.plans
            .filter((plan) => plan.is_active && plan.is_public)
            .sort((a, b) => a.price_monthly - b.price_monthly);

          setPlans(activePlans);
        }
      } catch (_error) {
        toast.error("Failed to load subscription plans", {
          description: "Please refresh the page to try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Trial Status Banner (only shows for trial users) */}
      <div className="mb-8">
        <TrialStatusBanner showGlobally={false} />
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground mb-2">
          Start free, scale as you grow. All plans include core features.
        </p>
        <p className="text-sm text-muted-foreground">
          All plans include unlimited team members, priority support, and
          regular updates.
        </p>
      </div>

      {/* Security Banner */}
      <div className="max-w-2xl mx-auto mb-8">
        <SecurityBanner variant="prominent" />
      </div>

      {/* Subscription Agreement */}
      <div className="max-w-2xl mx-auto mb-8">
        <SubscriptionAgreement />
      </div>

      {/* Pricing Table */}
      <div className="max-w-7xl mx-auto">
        {plans.length > 0 ? (
          <PricingTable plans={plans} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No subscription plans available at this time.
            </p>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="mt-16 max-w-4xl mx-auto">
        {/* FAQ Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {PRICING_FAQ_ITEMS.map((item) => (
              <div key={item.id}>
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 p-8 bg-muted rounded-md">
          <h3 className="text-xl font-semibold mb-2">
            Need help choosing a plan?
          </h3>
          <p className="text-muted-foreground mb-4">
            Our team is here to help you find the perfect plan for your needs.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {PRICING_SUPPORT_LINKS.map((link, index) => (
              <div key={link.id} className="contents">
                <a
                  href={link.href}
                  className="text-primary hover:underline font-medium"
                >
                  {link.label}
                </a>
                {index < PRICING_SUPPORT_LINKS.length - 1 && (
                  <span className="text-muted-foreground">•</span>
                )}
              </div>
            ))}
          </div>

          {/* Security Indicators */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <SecurityIndicators className="justify-center" />
          </div>
        </div>

        {/* Footer with Policy Links */}
        <Footer />
      </div>
    </div>
  );
}
