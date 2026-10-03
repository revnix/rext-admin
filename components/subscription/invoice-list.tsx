"use client";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadInvoicePdf,
  formatCurrency,
  formatDate,
  getStatusBadge,
  InvoiceDocument,
} from "@/components/subscription/invoice-document";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { Invoice } from "@/types/subscription";

export interface InvoiceListProps {
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of invoices to display */
  limit?: number;
  /** Show compact view */
  compact?: boolean;
}

/**
 * Invoice list with in-app view modal and direct PDF download
 */
export function InvoiceList({
  className,
  limit,
  compact = false,
}: InvoiceListProps) {
  const { invoices, invoicesLoading, fetchInvoices } = useSubscriptionStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch invoices on mount
  useEffect(() => {
    if (invoices.length === 0) {
      fetchInvoices();
    }
  }, [fetchInvoices, invoices.length]);

  // Handle View Invoice (Opens in-app modal)
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const isPaginated = !limit;
  const totalPages = isPaginated
    ? Math.ceil(invoices.length / itemsPerPage)
    : 1;

  const displayedInvoices = limit
    ? invoices.slice(0, limit)
    : invoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription className="mt-1">
                View and download your past invoices directly
              </CardDescription>
            </div>
            <Badge variant="outline">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {displayedInvoices.map((invoice) => {
              const invoiceItems = invoice.items ?? [];
              const invoiceNum =
                invoice.invoice_number ||
                `INV-${invoice.invoice_id.slice(0, 8)}`;

              return (
                <div
                  key={invoice.invoice_id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-md border bg-card hover:bg-accent/50 transition-colors",
                    compact && "p-3",
                  )}
                >
                  {/* Invoice Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 pt-0.5">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{invoiceNum}</p>
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

                      {!compact && invoiceItems.length > 0 && (
                        <div className="text-xs text-muted-foreground pt-1">
                          {invoiceItems.map((item, idx) => (
                            <span
                              key={`${invoice.invoice_id}-item-${item.description}`}
                            >
                              {item.description}
                              {idx < invoiceItems.length - 1 && " • "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice)}
                      className="hidden sm:inline-flex gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {limit && invoices.length > limit && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/billing">View All Invoices</a>
              </Button>
            </div>
          )}

          {/* Pagination Controls */}
          {isPaginated && invoices.length > 0 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="hidden sm:inline">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, invoices.length)} of{" "}
                  {invoices.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="sm:hidden">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, invoices.length)} of{" "}
                  {invoices.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-App Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4 pr-6">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    Invoice #
                    {selectedInvoice.invoice_number ||
                      `INV-${selectedInvoice.invoice_id.slice(0, 8)}`}
                    {getStatusBadge(selectedInvoice.status)}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Issued on {formatDate(selectedInvoice.invoice_date)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <InvoiceDocument invoice={selectedInvoice} />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => downloadInvoicePdf(selectedInvoice)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
