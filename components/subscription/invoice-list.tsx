"use client";
import { jsPDF } from "jspdf";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { Invoice, InvoiceStatus } from "@/types/subscription";

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

  // Get status badge variant
  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            Paid
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "void":
        return <Badge variant="outline">Void</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      case "partial_refunded":
        return <Badge variant="outline">Partially Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
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

  // Handle View Invoice (Opens in-app modal)
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Handle Direct Automatic Invoice PDF File Download
  const handleDownloadInvoice = (invoice: Invoice) => {
    const invNum =
      invoice.invoice_number || `INV-${invoice.invoice_id.slice(0, 8)}`;

    try {
      // Generate clean client-side PDF document using jsPDF synchronously
      // (Asynchronous fetch causes browsers to block the download)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const formattedDate = formatDate(invoice.invoice_date);
      const formattedPaidDate = formatDate(invoice.paid_at);
      const formattedAmount = formatCurrency(invoice.amount, invoice.currency);
      const subtotalFormatted = formatCurrency(
        invoice.subtotal ?? invoice.amount,
        invoice.currency,
      );
      const taxFormatted = formatCurrency(invoice.tax ?? 0, invoice.currency);

      // Document Header & Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("INVOICE", 20, 25);

      // Status Badge Box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(22, 101, 52);
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(155, 17, 35, 9, 2, 2, "F");
      doc.text(invoice.status.toUpperCase(), 172.5, 23, { align: "center" });

      // Invoice Meta Info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Invoice Number: ${invNum}`, 20, 33);
      doc.text(`Issued Date: ${formattedDate}`, 20, 39);

      // Divider Line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Billed To & Payment Info Columns
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("BILLED TO", 20, 52);
      doc.text("PAYMENT DETAILS", 110, 52);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(invoice.customer_name || "Customer", 20, 59);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(invoice.customer_email || "N/A", 20, 65);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Status: ${invoice.status}`, 110, 59);
      doc.text(`Paid Date: ${formattedPaidDate}`, 110, 65);
      doc.text(`Invoice ID: ${invoice.invoice_id}`, 110, 71);

      // Items Table Header
      let yPos = 82;
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos, 170, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("DESCRIPTION", 23, yPos + 5.5);
      doc.text("QTY", 120, yPos + 5.5, { align: "center" });
      doc.text("UNIT PRICE", 150, yPos + 5.5, { align: "right" });
      doc.text("AMOUNT", 187, yPos + 5.5, { align: "right" });

      yPos += 8;

      // Items Table Rows
      const items =
        invoice.items && invoice.items.length > 0
          ? invoice.items
          : [
            {
              description: "Subscription Plan Service",
              quantity: 1,
              unit_price: invoice.amount,
              total: invoice.amount,
            },
          ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);

      items.forEach((item) => {
        yPos += 8;
        doc.text(item.description, 23, yPos);
        doc.text(String(item.quantity), 120, yPos, { align: "center" });
        doc.text(formatCurrency(item.unit_price, invoice.currency), 150, yPos, {
          align: "right",
        });
        doc.text(formatCurrency(item.total, invoice.currency), 187, yPos, {
          align: "right",
        });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(20, yPos + 3, 190, yPos + 3);
      });

      // Financial Summary Totals
      yPos += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      doc.text("Subtotal:", 140, yPos);
      doc.text(subtotalFormatted, 187, yPos, { align: "right" });

      yPos += 6;
      doc.text("Tax:", 140, yPos);
      doc.text(taxFormatted, 187, yPos, { align: "right" });

      yPos += 8;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(135, yPos - 3, 190, yPos - 3);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Total Paid:", 140, yPos + 2);
      doc.text(formattedAmount, 187, yPos + 2, { align: "right" });

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Thank you for your business!", 105, 270, { align: "center" });

      // Trigger direct PDF file download to device
      doc.save(`Invoice-${invNum}.pdf`);
      toast.success(`Invoice ${invNum}.pdf downloaded successfully`);
    } catch (_err) {
      toast.error("Failed to generate PDF invoice");
    }
  };

  const isPaginated = !limit;
  const totalPages = isPaginated ? Math.ceil(invoices.length / itemsPerPage) : 1;

  const displayedInvoices = limit
    ? invoices.slice(0, limit)
    : invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                    "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
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
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="sm:hidden">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length}
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

            <div className="space-y-6 py-2">
              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Billed To
                  </p>
                  <p className="font-semibold text-foreground">
                    {selectedInvoice.customer_name || "Customer"}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedInvoice.customer_email || "No email available"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Details
                  </p>
                  <p className="text-muted-foreground">
                    Invoice ID:{" "}
                    <span className="font-mono text-foreground text-xs">
                      {selectedInvoice.invoice_id}
                    </span>
                  </p>
                  {selectedInvoice.paid_at && (
                    <p className="text-muted-foreground">
                      Paid Date:{" "}
                      <span className="text-foreground font-medium">
                        {formatDate(selectedInvoice.paid_at)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-medium text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items &&
                      selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item) => (
                        <tr
                          key={`${selectedInvoice.invoice_id}-modal-${item.description}-${item.unit_price}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(
                              item.unit_price,
                              selectedInvoice.currency,
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(
                              item.total,
                              selectedInvoice.currency,
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-medium">
                          Subscription Plan Service
                        </td>
                        <td className="px-4 py-3 text-center">1</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(
                            selectedInvoice.amount,
                            selectedInvoice.currency,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(
                            selectedInvoice.amount,
                            selectedInvoice.currency,
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex flex-col items-end space-y-2 pt-2 border-t text-sm">
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(
                      selectedInvoice.subtotal ?? selectedInvoice.amount,
                      selectedInvoice.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Tax:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(
                      selectedInvoice.tax ?? 0,
                      selectedInvoice.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between w-64 text-base font-bold pt-2 border-t text-foreground">
                  <span>Total Amount:</span>
                  <span className="text-primary">
                    {formatCurrency(
                      selectedInvoice.amount,
                      selectedInvoice.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
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
