/**
 * /admin/status (rext-control#728): the incident banner's switch is for `security.manage`. An admin
 * without it who opens the address gets the reason, not the form.
 */

import { render, screen } from "@testing-library/react";

import IncidentBannerPage from "@/app/admin/status/page";

const mockGranted = new Set<string>();
jest.mock("@/components/permission/admin-guard", () => ({
  AdminGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/permission/permission-guard", () => ({
  PermissionGuard: ({
    permission,
    fallback,
    children,
  }: {
    permission: string;
    fallback: React.ReactNode;
    children: React.ReactNode;
  }) => <>{mockGranted.has(permission) ? children : fallback}</>,
}));
jest.mock("@/components/admin/incident-banner-form", () => ({
  IncidentBannerForm: () => <p>The banner's form</p>,
}));

beforeEach(() => mockGranted.clear());

describe("the incident banner's page", () => {
  it("shows the switch to someone who holds security.manage", () => {
    mockGranted.add("security.manage");
    render(<IncidentBannerPage />);
    expect(
      screen.getByRole("heading", { name: "Incident banner" }),
    ).toBeVisible();
    expect(screen.getByText("The banner's form")).toBeVisible();
  });

  it("says why to an admin without it, and mounts no form", () => {
    mockGranted.add("security.read");
    render(<IncidentBannerPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You can't switch the incident banner",
    );
    expect(screen.queryByText("The banner's form")).toBeNull();
  });
});
