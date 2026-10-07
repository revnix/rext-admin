/**
 * The history of admin changes to someone's credits (FB2.28): the backend's two lists (the credits
 * added, and every add, deduct and reset) as one, newest first, with an add and the grant it made
 * shown once.
 */

import {
  type HistoryAdjustment,
  type HistoryGrant,
  historyDetails,
  historyTitle,
  mergeCreditHistory,
} from "@/lib/billing/credit-history";

const ADMIN = "admin@example.com";
// A reading of "now" for the expiries below.
const NOW = Date.parse("2026-10-08T12:00:00Z");

/** A grant as GET /admin/users/{id}/credits sends it. */
const adminGrant = (fields: Partial<HistoryGrant>): HistoryGrant => ({
  id: "grant-1",
  amount: 200,
  remaining: 120,
  forfeited: 30,
  reason: "Compensation for the outage",
  expires_at: "2026-10-31T12:00:00Z",
  created_at: "2026-10-05T10:00:00Z",
  granted_by: "admin-id",
  granted_by_email: ADMIN,
  ...fields,
});

/** An adjustment as GET /admin/users/{id}/credits sends it. */
const adminAdjustment = (
  fields: Partial<HistoryAdjustment>,
): HistoryAdjustment => ({
  id: "audit-1",
  action: "add",
  amount: 200,
  requested_amount: 200,
  balance_before: 500,
  balance_after: 700,
  reason: "Compensation for the outage",
  expires_at: "2026-10-31T12:00:00+00:00",
  grant_id: "grant-1",
  adjusted_by: "admin-id",
  adjusted_by_email: ADMIN,
  created_at: "2026-10-05T10:00:00Z",
  ...fields,
});

/** The customer's rows: no grant id, no requested amount, no email; the actor is a name. */
const customerGrant = (fields: Partial<HistoryGrant>): HistoryGrant => ({
  id: "grant-1",
  amount: 200,
  remaining: 120,
  forfeited: 30,
  reason: "Compensation for the outage",
  expires_at: "2026-10-31T12:00:00Z",
  created_at: "2026-10-05T10:00:00.120Z",
  granted_by: "Rext support",
  ...fields,
});

const customerAdjustment = (
  fields: Partial<HistoryAdjustment>,
): HistoryAdjustment => ({
  id: "audit-1",
  action: "add",
  amount: 200,
  balance_before: 500,
  balance_after: 700,
  reason: "Compensation for the outage",
  expires_at: "2026-10-31T12:00:00+00:00",
  adjusted_by: "Rext support",
  created_at: "2026-10-05T10:00:00.480Z",
  ...fields,
});

describe("mergeCreditHistory, the admin's view", () => {
  it("shows an add and the grant it made as one row, with the grant's figures", () => {
    const rows = mergeCreditHistory(
      { grants: [adminGrant({})], adjustments: [adminAdjustment({})] },
      "admin",
    );
    expect(rows).toEqual([
      {
        id: "audit-1",
        action: "add",
        amount: 200,
        requested_amount: 200,
        balance_before: 500,
        balance_after: 700,
        reason: "Compensation for the outage",
        by: ADMIN,
        created_at: "2026-10-05T10:00:00Z",
        grant: {
          remaining: 120,
          forfeited: 30,
          expires_at: "2026-10-31T12:00:00Z",
        },
      },
    ]);
  });

  it("puts adds, deducts and resets in one list, newest first", () => {
    const rows = mergeCreditHistory(
      {
        grants: [
          adminGrant({ id: "grant-2", created_at: "2026-10-07T09:00:00Z" }),
          adminGrant({ id: "grant-1", created_at: "2026-10-01T09:00:00Z" }),
        ],
        adjustments: [
          adminAdjustment({
            id: "audit-4",
            grant_id: "grant-2",
            created_at: "2026-10-07T09:00:00Z",
          }),
          adminAdjustment({
            id: "audit-3",
            action: "reset",
            amount: 120,
            requested_amount: null,
            grant_id: null,
            created_at: "2026-10-06T09:00:00Z",
          }),
          adminAdjustment({
            id: "audit-2",
            action: "deduct",
            amount: 30,
            requested_amount: 50,
            grant_id: null,
            created_at: "2026-10-03T09:00:00Z",
          }),
          adminAdjustment({
            id: "audit-1",
            grant_id: "grant-1",
            created_at: "2026-10-01T09:00:00Z",
          }),
        ],
      },
      "admin",
    );
    expect(rows.map((row) => [row.id, row.action])).toEqual([
      ["audit-4", "add"],
      ["audit-3", "reset"],
      ["audit-2", "deduct"],
      ["audit-1", "add"],
    ]);
    // Only the adds carry a grant's figures.
    expect(rows.map((row) => row.grant !== null)).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });

  it("sorts by time whatever order the two lists come in", () => {
    const rows = mergeCreditHistory(
      {
        grants: [
          adminGrant({ id: "grant-old", created_at: "2026-09-01T09:00:00Z" }),
        ],
        adjustments: [
          adminAdjustment({
            id: "audit-old",
            action: "deduct",
            grant_id: null,
            created_at: "2026-10-02T09:00:00Z",
          }),
          adminAdjustment({
            id: "audit-new",
            action: "reset",
            grant_id: null,
            created_at: "2026-10-06T09:00:00Z",
          }),
        ],
      },
      "admin",
    );
    expect(rows.map((row) => row.id)).toEqual([
      "audit-new",
      "audit-old",
      "grant-old",
    ]);
  });

  it("keeps a grant no adjustment in the list made, as an add of its own", () => {
    const rows = mergeCreditHistory(
      { grants: [adminGrant({ id: "grant-9" })], adjustments: [] },
      "admin",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "grant-9",
      action: "add",
      amount: 200,
      by: ADMIN,
      balance_before: null,
      grant: { remaining: 120, forfeited: 30 },
    });
  });

  it("keeps an add whose grant isn't in the list, without a grant's figures", () => {
    const rows = mergeCreditHistory(
      { grants: [], adjustments: [adminAdjustment({ grant_id: "gone" })] },
      "admin",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "audit-1",
      action: "add",
      grant: null,
    });
  });

  it("joins by the grant's id, not by what the rows hold", () => {
    // Two adds of the same amount for the same reason at the same moment.
    const rows = mergeCreditHistory(
      {
        grants: [
          adminGrant({ id: "grant-a", remaining: 200, forfeited: 0 }),
          adminGrant({ id: "grant-b", remaining: 0, forfeited: 200 }),
        ],
        adjustments: [
          adminAdjustment({ id: "audit-b", grant_id: "grant-b" }),
          adminAdjustment({ id: "audit-a", grant_id: "grant-a" }),
        ],
      },
      "admin",
    );
    expect(rows.map((row) => [row.id, row.grant?.remaining])).toEqual([
      ["audit-b", 0],
      ["audit-a", 200],
    ]);
  });

  it("names the admin by email, and nobody when the account is gone", () => {
    const rows = mergeCreditHistory(
      {
        grants: [],
        adjustments: [
          adminAdjustment({
            action: "deduct",
            grant_id: null,
            adjusted_by: null,
            adjusted_by_email: null,
          }),
        ],
      },
      "admin",
    );
    // Never the admin's id.
    expect(rows[0].by).toBeNull();
  });

  it("reads an action it doesn't know as none", () => {
    const rows = mergeCreditHistory(
      {
        grants: [],
        adjustments: [adminAdjustment({ action: "refund", grant_id: null })],
      },
      "admin",
    );
    expect(rows[0].action).toBeNull();
    expect(historyTitle(rows[0])).toBe("Credits changed");
  });
});

describe("mergeCreditHistory, the customer's view", () => {
  it("shows an add once, though its rows carry no grant id", () => {
    const rows = mergeCreditHistory(
      { grants: [customerGrant({})], adjustments: [customerAdjustment({})] },
      "customer",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "audit-1",
      action: "add",
      amount: 200,
      by: "Rext support",
      grant: { remaining: 120, forfeited: 30 },
    });
  });

  it("pairs each add with the grant nearest in time, one to one", () => {
    const rows = mergeCreditHistory(
      {
        grants: [
          customerGrant({
            id: "grant-2",
            remaining: 200,
            created_at: "2026-10-05T10:00:20.100Z",
          }),
          customerGrant({
            id: "grant-1",
            remaining: 0,
            created_at: "2026-10-05T10:00:00.100Z",
          }),
        ],
        adjustments: [
          customerAdjustment({
            id: "audit-2",
            created_at: "2026-10-05T10:00:20.300Z",
          }),
          customerAdjustment({
            id: "audit-1",
            created_at: "2026-10-05T10:00:00.300Z",
          }),
        ],
      },
      "customer",
    );
    expect(rows.map((row) => [row.id, row.grant?.remaining])).toEqual([
      ["audit-2", 200],
      ["audit-1", 0],
    ]);
  });

  it("doesn't pair an add with a grant of another amount, reason or day", () => {
    const rows = mergeCreditHistory(
      {
        grants: [
          customerGrant({ id: "grant-amount", amount: 150 }),
          customerGrant({ id: "grant-reason", reason: "Goodwill" }),
          customerGrant({
            id: "grant-day",
            created_at: "2026-10-04T10:00:00Z",
          }),
        ],
        adjustments: [customerAdjustment({})],
      },
      "customer",
    );
    expect(rows).toHaveLength(4);
    expect(rows.find((row) => row.id === "audit-1")?.grant).toBeNull();
  });

  it("never pairs a deduct or a reset with a grant", () => {
    const rows = mergeCreditHistory(
      {
        grants: [customerGrant({})],
        adjustments: [customerAdjustment({ action: "deduct" })],
      },
      "customer",
    );
    expect(rows.map((row) => [row.id, row.action])).toEqual([
      ["audit-1", "deduct"],
      ["grant-1", "add"],
    ]);
  });

  it("is empty when Rext support changed nothing", () => {
    expect(
      mergeCreditHistory({ grants: [], adjustments: [] }, "customer"),
    ).toEqual([]);
  });
});

describe("historyTitle", () => {
  const row = (fields: Partial<HistoryAdjustment>) =>
    mergeCreditHistory(
      {
        grants: [],
        adjustments: [adminAdjustment({ grant_id: null, ...fields })],
      },
      "admin",
    )[0];

  it("says what happened and how many credits", () => {
    expect(historyTitle(row({}))).toBe("200 credits added");
    expect(historyTitle(row({ amount: 1 }))).toBe("1 credit added");
    expect(
      historyTitle(row({ action: "deduct", amount: 50, requested_amount: 50 })),
    ).toBe("50 credits deducted");
  });

  it("says when a deduct took less than asked", () => {
    expect(
      historyTitle(row({ action: "deduct", amount: 30, requested_amount: 50 })),
    ).toBe("30 credits deducted of the 50 asked for");
  });

  it("says which way a reset moved the month's credits", () => {
    const reset = (amount: number | null) =>
      historyTitle(row({ action: "reset", amount, requested_amount: null }));
    expect(reset(120)).toBe("Monthly credits reset, 120 more than before");
    expect(reset(-80)).toBe("Monthly credits reset, 80 fewer than before");
    expect(reset(0)).toBe(
      "Monthly credits reset, already at the plan's amount",
    );
    expect(reset(null)).toBe("Monthly credits reset");
  });
});

describe("historyDetails", () => {
  const add = (grant: Partial<HistoryGrant>) =>
    mergeCreditHistory(
      { grants: [adminGrant(grant)], adjustments: [adminAdjustment({})] },
      "admin",
    )[0];

  it("says what is left of an add, what was taken back, its expiry and the balance", () => {
    expect(historyDetails(add({}), NOW)).toEqual([
      "120 left",
      "30 taken back",
      "Expires Oct 31, 2026",
      "Balance from 500 to 700",
    ]);
  });

  it("says when added credits never expire, and leaves out nothing taken back", () => {
    expect(
      historyDetails(add({ forfeited: 0, expires_at: null }), NOW),
    ).toEqual(["120 left", "No expiry", "Balance from 500 to 700"]);
  });

  it("doesn't call expired credits left", () => {
    expect(
      historyDetails(
        add({ forfeited: 0, expires_at: "2026-10-01T12:00:00Z" }),
        NOW,
      ),
    ).toEqual([
      "Expired Oct 1, 2026 with 120 unspent",
      "Balance from 500 to 700",
    ]);
    expect(
      historyDetails(
        add({ remaining: 0, forfeited: 0, expires_at: "2026-10-01T12:00:00Z" }),
        NOW,
      ),
    ).toEqual(["Expired Oct 1, 2026", "Balance from 500 to 700"]);
  });

  it("gives a deduct or a reset the balance only", () => {
    const deduct = mergeCreditHistory(
      {
        grants: [],
        adjustments: [
          adminAdjustment({
            action: "deduct",
            grant_id: null,
            balance_before: 700,
            balance_after: 650,
          }),
        ],
      },
      "admin",
    )[0];
    expect(historyDetails(deduct, NOW)).toEqual(["Balance from 700 to 650"]);
  });
});
