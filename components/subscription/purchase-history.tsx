"use client";

/**
 * Purchase History
 *
 * The customer's own orders, read from our database rather than LemonSqueezy,
 * with the refund control for each one.
 *
 * Kept separate from `InvoiceList`, which renders the invoice shape and is
 * used elsewhere. Orders carry refund-request state that invoices do not, and
 * that state is what decides which control a row shows.
 *
 * @module components/subscription/purchase-history
 */

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ReceiptDialog } from "@/components/subscription/receipt-dialog";
import { RefundRequestButton } from "@/components/subscription/refund-request-button";
import { Badge } from "@/components/ui/badge";
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.subscriptions.getOrders();
      setOrders(response.orders ?? []);
    } catch (error) {
      log.error("Failed to load purchases", error);
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {order.product_name ?? "Purchase"}
              </span>
              {order.status === "refunded" && (
                <Badge variant="outline">Refunded</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatAmount(order.total, order.currency)}
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
            <ReceiptDialog order={order} />
            <RefundRequestButton order={order} onSubmitted={load} />
          </div>
        </div>
      ))}
    </div>
  );
}
