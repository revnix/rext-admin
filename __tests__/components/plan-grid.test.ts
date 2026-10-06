/**
 * The plan grid (F3) shows only what the catalogue says: the offer while its window is open, in
 * the catalogue's terms, and prices formatted from its numbers.
 */

import {
  activeOffer,
  formatPrice,
  offerEnd,
  offerWords,
} from "@/components/billing/plan-grid";
import type { CatalogOffer, PlanCatalog } from "@/types/plan-catalog";

const offer: CatalogOffer = {
  id: "launch-2026-10",
  label: "Launch bonus",
  kind: "first_month_credit_multiplier",
  credit_multiplier: 2,
  bonus_credits: null,
  starts_at: "2026-10-07T07:00:00+00:00",
  ends_at: "2026-10-14T06:59:00+00:00",
};

const catalog = (o: CatalogOffer | null) =>
  ({
    currency: "USD",
    plans: [],
    trial: null,
    credits: {},
    offer: o,
  }) as unknown as PlanCatalog;

describe("activeOffer", () => {
  it("shows the offer only inside its window", () => {
    expect(
      activeOffer(catalog(offer), new Date("2026-10-07T06:59:59Z")),
    ).toBeNull();
    expect(activeOffer(catalog(offer), new Date("2026-10-07T07:00:00Z"))).toBe(
      offer,
    );
    expect(activeOffer(catalog(offer), new Date("2026-10-14T06:58:59Z"))).toBe(
      offer,
    );
    expect(
      activeOffer(catalog(offer), new Date("2026-10-14T06:59:00Z")),
    ).toBeNull();
  });

  it("shows nothing when there is no offer", () => {
    expect(activeOffer(catalog(null))).toBeNull();
  });
});

describe("offerWords", () => {
  it("says what the catalogue's offer gives", () => {
    expect(offerWords(offer)).toBe("Double credits in your first month");
    expect(offerWords({ ...offer, credit_multiplier: 3 })).toBe(
      "3× credits in your first month",
    );
    expect(
      offerWords({ ...offer, credit_multiplier: null, bonus_credits: 500 }),
    ).toBe("500 extra credits in your first month");
    expect(
      offerWords({ ...offer, credit_multiplier: null, bonus_credits: null }),
    ).toBe("Launch bonus");
  });
});

describe("offerEnd", () => {
  it("gives the end in Pacific time, as the site does", () => {
    expect(offerEnd(offer)).toBe("Tuesday, October 13 at 11:59 PM PDT");
  });
});

describe("formatPrice", () => {
  it("drops the cents from whole amounts and keeps them otherwise", () => {
    expect(formatPrice(39, "USD")).toBe("$39");
    expect(formatPrice(32.5, "USD")).toBe("$32.50");
    expect(formatPrice(1.18, "USD")).toBe("$1.18");
  });
});
