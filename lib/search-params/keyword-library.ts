import { createLoader } from "nuqs/server";
import {
  dataTableParams,
  parseAsSort,
} from "@/components/ui/data-table/url-state";

/**
 * The keyword library's table state as URL search params (`?q=…&sort=volume.desc&page=2`), so a
 * reload, a shared link and Back keep them. Newest research first.
 */
export const keywordLibraryParams = {
  ...dataTableParams,
  sort: parseAsSort.withDefault({ id: "researched", desc: true }),
};

export const loadKeywordLibraryParams = createLoader(keywordLibraryParams);
