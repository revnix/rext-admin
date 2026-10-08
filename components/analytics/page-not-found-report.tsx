"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { pathShape } from "@/lib/analytics-failures";

/**
 * Says that a person landed on an address with no page behind it (rext-control task 894), as the
 * address's shape: the app's own words kept, every other part a star. Rendered by the not-found
 * pages, which stay server components themselves.
 */
export function PageNotFoundReport() {
  useEffect(() => {
    analytics.track("page_not_found", {
      route: pathShape(window.location.pathname),
    });
  }, []);

  return null;
}
