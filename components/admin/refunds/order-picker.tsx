"use client";

/**
 * Refundable Order Picker
 *
 * Lets an admin find the order to refund instead of having to already know its
 * LemonSqueezy order id. Search by customer email, name, product or order id,
 * then pick a row — the id is filled in from the selection.
 *
 * Paid and partially refunded orders are both returned: a partial refund
 * leaves a balance that is still refundable. A row is only unselectable once
 * nothing is left (`refundable_amount <= 0`), so the admin sees that before
 * submitting rather than hitting the API's guard.
 *
 * @module components/admin/refunds/order-picker
 */

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { RefundableOrder } from "@/lib/api-client/admin-refunds";
import { log } from "@/lib/logger";

interface OrderPickerProps {
  /** Currently selected order, if any. */
  selected: RefundableOrder | null;
  /** Called when the admin picks or clears an order. */
  onSelect: (order: RefundableOrder | null) => void;
}

/** Render cents as a currency string. */
function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

export function OrderPicker({ selected, onSelect }: OrderPickerProps) {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<RefundableOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchOrders = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const response = await apiClient.adminRefunds.searchOrders({
        search: term || undefined,
        per_page: 20,
      });
      setOrders(response.data ?? []);
    } catch (error) {
      log.error("Failed to search refundable orders", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  // Debounced so typing an email does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchOrders]);

  if (selected) {
    return (
      <div className="rounded-md border p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">
              {selected.product_name ?? "Order"}{" "}
              <span className="text-muted-foreground">
                · {formatAmount(selected.total, selected.currency)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {selected.user_email ?? "unknown customer"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Order {selected.lemonsqueezy_order_id}
            </p>
            {selected.refunded_amount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatAmount(selected.refunded_amount, selected.currency)}{" "}
                already refunded ·{" "}
                {formatAmount(selected.refundable_amount, selected.currency)}{" "}
                still refundable
              </p>
            )}
          </div>
          <button
            type="button"
            className="text-sm underline shrink-0"
            onClick={() => onSelect(null)}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, product or order id"
          className="pl-8"
        />
      </div>

      <div className="flex-1 min-h-0 max-h-56 overflow-y-auto scrollbar-hide rounded-md border divide-y">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </div>
        )}

        {!loading && loaded && orders.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            No paid orders found
            {search ? ` matching “${search}”` : ""}. Orders appear here once
            LemonSqueezy&apos;s order webhook has been received.
          </p>
        )}

        {!loading &&
          orders.map((order) => {
            // The server decides refundability; this only renders it.
            const disabled = order.refundable_amount <= 0;
            const partiallyRefunded = order.refunded_amount > 0 && !disabled;
            return (
              <button
                key={order.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(order)}
                className="w-full text-left p-3 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">
                    {order.product_name ?? "Order"}
                  </span>
                  <span className="shrink-0 text-sm">
                    {formatAmount(order.total, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground truncate">
                    {order.user_email ?? "unknown customer"}
                  </span>
                  {disabled && (
                    <Badge variant="secondary" className="shrink-0">
                      Refunded
                    </Badge>
                  )}
                  {partiallyRefunded && (
                    <Badge variant="outline" className="shrink-0">
                      {formatAmount(order.refundable_amount, order.currency)}{" "}
                      left
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {order.lemonsqueezy_order_id}
                  {order.ordered_at
                    ? ` · ${new Date(order.ordered_at).toLocaleDateString()}`
                    : ""}
                </p>
              </button>
            );
          })}
      </div>
    </div>
  );
}
