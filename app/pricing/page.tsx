"use client";

import { Loader2 } from "lucide-react";
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

  useEffect(() => {
    // Fetch subscription if user is logged in
    fetchSubscription();
  }, [fetchSubscription]);

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
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
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
          <PricingTable />
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
            <div>
              <h3 className="font-semibold mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes. Plan changes are applied immediately, and prorations are handled by our billing provider.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American
                Express) and PayPal through our secure payment processor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! All new accounts start with a free trial period. No credit
                card required to get started.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely. You can cancel your subscription at any time from
                your billing dashboard. You'll continue to have access until the
                end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-sm text-muted-foreground">
                Your data is safely stored for 30 days after cancellation. You
                can reactivate your subscription anytime during this period and
                pick up right where you left off.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day money-back guarantee on all paid plans. If
                you're not satisfied, contact our support team for a full
                refund.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 p-8 bg-muted rounded-lg">
          <h3 className="text-xl font-semibold mb-2">
            Need help choosing a plan?
          </h3>
          <p className="text-muted-foreground mb-4">
            Our team is here to help you find the perfect plan for your needs.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/dashboard/subscription"
              className="text-primary hover:underline font-medium"
            >
              View Subscription Dashboard
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="mailto:support@wrext.com"
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="/docs/pricing"
              className="text-primary hover:underline font-medium"
            >
              View Documentation
            </a>
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
