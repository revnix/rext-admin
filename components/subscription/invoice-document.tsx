"use client";

/**
 * Invoice Document
 *
 * The rendered body of a billing document, plus its PDF export and the
 * formatters both share.
 *
 * Invoices and purchase receipts are the same document with a different
 * label, so both `InvoiceList` and `ReceiptDialog` render this rather than
 * keeping their own copies. Orders reach it through `orderToInvoice`.
 *
 * @module components/subscription/invoice-document
 */

import { jsPDF } from "jspdf";
import { Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { Invoice, InvoiceStatus, OrderRow } from "@/types/subscription";

/** "Invoice" for billing history, "Receipt" for a purchase. */
export type DocumentLabel = "Invoice" | "Receipt";

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const getStatusBadge = (status: InvoiceStatus | string) => {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "paid":
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          Paid
        </Badge>
      );
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "void":
      return <Badge variant="outline">Void</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    case "partial_refund":
    case "partial_refunded":
      return <Badge variant="outline">Partially Refunded</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

/**
 * Present an order as an invoice.
 *
 * Order amounts are in cents, invoice amounts in major units — the same
 * conversion the backend does when it serves orders as invoices.
 */
export function orderToInvoice(order: OrderRow): Invoice {
  return {
    invoice_id: order.lemonsqueezy_order_id,
    invoice_number: order.lemonsqueezy_order_id,
    subscription_id: order.subscription_id,
    status: order.status as InvoiceStatus,
    amount: (order.total ?? 0) / 100,
    subtotal: (order.subtotal ?? order.total ?? 0) / 100,
    tax: (order.tax ?? 0) / 100,
    currency: order.currency || "USD",
    invoice_url: order.receipt_url,
    invoice_date: order.ordered_at || order.created_at,
    due_date: null,
    paid_at: order.refunded_at ? null : order.ordered_at,
    customer_email: order.customer_email ?? null,
    customer_name: null,
    items: [
      {
        description: order.product_name || "Subscription Plan Service",
        quantity: 1,
        unit_price: (order.total ?? 0) / 100,
        total: (order.total ?? 0) / 100,
      },
    ],
  };
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  /** Wording for the reference row; the layout is identical either way. */
  label?: DocumentLabel;
}

/** Billed-to block, line items and totals. The dialog around it is the caller's. */
export function InvoiceDocument({
  invoice,
  label = "Invoice",
}: InvoiceDocumentProps) {
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

  return (
    <div className="space-y-6 py-2">
      {/* Customer & Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-muted/50 border text-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Billed To
          </p>
          <p className="font-semibold text-foreground">
            {invoice.customer_name || "Customer"}
          </p>
          <p className="text-muted-foreground">
            {invoice.customer_email || "No email available"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Details
          </p>
          <p className="text-muted-foreground">
            {label} ID:{" "}
            <span className="font-mono text-foreground text-xs">
              {invoice.invoice_id}
            </span>
          </p>
          {invoice.subscription_id && (
            <p className="text-muted-foreground">
              Subscription ID:{" "}
              <span className="font-mono text-foreground text-xs">
                {invoice.subscription_id}
              </span>
            </p>
          )}
          {invoice.paid_at && (
            <p className="text-muted-foreground">
              Paid Date:{" "}
              <span className="text-foreground font-medium">
                {formatDate(invoice.paid_at)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="border rounded-md overflow-x-auto">
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
            {items.map((item) => (
              <tr
                key={`${invoice.invoice_id}-${item.description}-${item.unit_price}`}
              >
                <td className="px-4 py-3 font-medium">{item.description}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(item.unit_price, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(item.total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Totals */}
      <div className="flex flex-col items-end space-y-2 pt-2 border-t text-sm">
        <div className="flex justify-between w-64 text-muted-foreground">
          <span>Subtotal:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(
              invoice.subtotal ?? invoice.amount,
              invoice.currency,
            )}
          </span>
        </div>
        <div className="flex justify-between w-64 text-muted-foreground">
          <span>Tax:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(invoice.tax ?? 0, invoice.currency)}
          </span>
        </div>
        <div className="flex justify-between w-64 text-base font-bold pt-2 border-t text-foreground">
          <span>Total Amount:</span>
          <span className="text-primary">
            {formatCurrency(invoice.amount, invoice.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate and download the document as a PDF.
 *
 * Built client-side with jsPDF and saved synchronously: an async fetch here
 * makes browsers block the download.
 */
export function downloadInvoicePdf(
  invoice: Invoice,
  label: DocumentLabel = "Invoice",
) {
  const invNum =
    invoice.invoice_number || `INV-${invoice.invoice_id.slice(0, 8)}`;

  try {
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
    doc.text(label.toUpperCase(), 20, 25);

    // Status Badge Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(155, 17, 35, 9, 2, 2, "F");
    doc.text(invoice.status.toUpperCase(), 172.5, 23, { align: "center" });

    // Meta Info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${label} Number: ${invNum}`, 20, 33);
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
    doc.text(`${label} ID: ${invoice.invoice_id}`, 110, 71);
    if (invoice.subscription_id) {
      doc.text(`Subscription ID: ${invoice.subscription_id}`, 110, 77);
    }

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
    doc.text(
      "Issued by Lemon Squeezy, the merchant of record for this purchase.",
      105,
      265,
      { align: "center" },
    );
    doc.text("Thank you for your business!", 105, 270, { align: "center" });

    doc.save(`${label}-${invNum}.pdf`);
    toast.success(`${label} ${invNum}.pdf downloaded successfully`);
  } catch (_err) {
    toast.error(`Failed to generate PDF ${label.toLowerCase()}`);
  }
}
