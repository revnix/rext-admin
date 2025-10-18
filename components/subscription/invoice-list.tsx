"use client";

/**
 * Invoice List Component
 *
 * Displays invoice history with download/view links to LemonSqueezy invoices.
 *
 * @module components/subscription/invoice-list
 */

import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";

export interface InvoiceListProps {
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of invoices to display */
  limit?: number;
  /** Show compact view */
  compact?: boolean;
}

/**
 * Invoice list with download/view links
 */
export function InvoiceList({
  className,
  limit,
  compact = false,
}: InvoiceListProps) {
  const { invoices, invoicesLoading, fetchInvoices } = useSubscriptionStore();

  // Fetch invoices on mount
  useEffect(() => {
    if (invoices.length === 0) {
      fetchInvoices();
    }
  }, [fetchInvoices, invoices.length]);

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-500">
            Paid
          </Badge>
        );
      case "unpaid":
        return <Badge variant="destructive">Unpaid</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const displayedInvoices = limit ? invoices.slice(0, limit) : invoices;

  if (invoicesLoading && invoices.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0 && !invoicesLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>No invoices found for your account.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription className="mt-1">
              View and download your past invoices
            </CardDescription>
          </div>
          <Badge variant="outline">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {displayedInvoices.map((invoice) => (
            <div
              key={invoice.invoice_id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                compact && "p-3",
              )}
            >
              {/* Invoice Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {invoice.invoice_number ||
                        `INV-${invoice.invoice_id.slice(0, 8)}`}
                    </p>
                    {getStatusBadge(invoice.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(invoice.invoice_date)}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                    {invoice.paid_at && (
                      <span className="text-green-600 dark:text-green-400 text-xs">
                        Paid {formatDate(invoice.paid_at)}
                      </span>
                    )}
                  </div>

                  {!compact && invoice.items && invoice.items.length > 0 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      {invoice.items.map((item, idx) => (
                        <span key={`${invoice.id}-item-${idx}`}>
                          {item.description}
                          {idx < invoice.items.length - 1 && " • "}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {invoice.invoice_url && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hidden sm:inline-flex"
                    >
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>

                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </Button>
                  </>
                )}

                {!invoice.invoice_url && (
                  <span className="text-xs text-muted-foreground">
                    No download available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {limit && invoices.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/billing">View All Invoices</a>
            </Button>
          </div>
        )}

        {/* Empty State */}
        {displayedInvoices.length === 0 && !invoicesLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invoices to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
