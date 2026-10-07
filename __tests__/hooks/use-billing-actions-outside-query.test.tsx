/**
 * useBillingActions runs above QueryProvider: the card dialog that reads the saved card renders in
 * the root layout before it (LemonSqueezyProvider). A query client in the hook throws there, on
 * every page.
 */

import { renderHook } from "@testing-library/react";
import { useBillingActions } from "@/hooks/use-billing-actions";

describe("useBillingActions", () => {
  it("needs no query client", () => {
    const { result } = renderHook(() => useBillingActions());

    expect(result.current.hasBillingAccount).toBe(false);
    expect(typeof result.current.resumeSubscription).toBe("function");
  });
});
