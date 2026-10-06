import { createLoader } from "nuqs/server";
import {
  dataTableParams,
  parseAsSort,
} from "@/components/ui/data-table/url-state";

/**
 * The invoices table's state as URL search params (`?sort=date.desc&page=2`), so a reload and a
 * shared link keep them. Account settings, Invoices reads them with `useDataTableUrlState`.
 */
export const invoiceListParams = {
  ...dataTableParams,
  sort: parseAsSort.withDefault({ id: "date", desc: true }),
};

export const loadInvoiceListParams = createLoader(invoiceListParams);
