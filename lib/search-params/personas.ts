import { createLoader } from "nuqs/server";
import {
  dataTableParams,
  parseAsSort,
} from "@/components/ui/data-table/url-state";

/**
 * The persona table's state as URL search params (`?q=…&sort=name.asc&page=2`), so a reload, a
 * shared link and Back keep them. The page reads them with `useDataTableUrlState(personaListParams)`.
 */
export const personaListParams = {
  ...dataTableParams,
  sort: parseAsSort.withDefault({ id: "name", desc: false }),
};

export const loadPersonaListParams = createLoader(personaListParams);
