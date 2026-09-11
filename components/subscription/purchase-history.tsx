"use client";

/**
 * Purchase History
 *
 * The customer's own orders, read from our database rather than LemonSqueezy.
 *
 * A purchase row records the purchase and nothing else: what was bought, for
 * how much, when, and a receipt. A later refund never rewrites that row —
 * refunds are separate events and live in the invoice history, which carries a
 * credit line per refund.
 *
 * @module components/subscription/purchase-history
 */

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReceiptDialog } from "@/components/subscription/receipt-dialog";
import { RefundRequestButton } from "@/components/subscription/refund-request-button";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import type { OrderRow } from "@/types/subscription";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

export function PurchaseHistory() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  // A failed load is not an empty history. Without this the two are
  // indistinguishable on screen, and a request that 401s or times out reads as
  // "you have never bought anything" — which sends you looking for the bug in
  // the wrong place entirely.
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.subscriptions.getOrders();
      setOrders(response.orders ?? []);
    } catch (err) {
      log.error("Failed to load purchases", err);
      setError(err instanceof Error ? err.message : "Failed to load purchases");
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading purchases…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load your purchases.
        </p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No purchases yet.
      </p>
    );
  }

  return (
    <div className="divide-y rounded-md border">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium truncate">
              {order.product_name ?? "Purchase"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span>Paid: {formatAmount(order.total, order.currency)}</span>
              {order.ordered_at
                ? ` · ${new Date(order.ordered_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}`
                : ""}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <RefundRequestButton order={order} onSubmitted={load} />
            <ReceiptDialog order={order} />
          </div>
        </div>
      ))}
    </div>
  );
}
