"use client";

/**
 * Receipt Dialog
 *
 * Renders a purchase receipt in our own UI from the order we already store,
 * rather than framing LemonSqueezy's hosted receipt page.
 *
 * It shares `InvoiceDocument` with the invoice history, so a receipt and an
 * invoice read the same way. LemonSqueezy remains the merchant of record, so
 * its hosted copy stays one click away.
 *
 * @module components/subscription/receipt-dialog
 */

import { Download, ExternalLink, Receipt } from "lucide-react";
import { useState } from "react";
import {
  downloadInvoicePdf,
  formatDate,
  getStatusBadge,
  InvoiceDocument,
  orderToInvoice,
} from "@/components/subscription/invoice-document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrderRow } from "@/types/subscription";

interface ReceiptDialogProps {
  /** The purchase this receipt is for. */
  order: OrderRow;
}

export function ReceiptDialog({ order }: ReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const invoice = orderToInvoice(order);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Receipt className="mr-2 h-4 w-4" />
        Receipt
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  Receipt #{invoice.invoice_number}
                  {getStatusBadge(order.status)}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {order.product_name ? `${order.product_name} · ` : ""}Issued
                  on {formatDate(invoice.invoice_date)} by Lemon Squeezy, the
                  merchant of record.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <InvoiceDocument invoice={invoice} label="Receipt" />

          <DialogFooter className="gap-2 sm:gap-0">
            {order.receipt_url && (
              // LemonSqueezy's own copy: the authoritative document for tax
              // purposes, and the only place to change billing details on it.
              <Button variant="ghost" asChild>
                <a
                  href={order.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Lemon Squeezy
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => downloadInvoicePdf(invoice, "Receipt")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
