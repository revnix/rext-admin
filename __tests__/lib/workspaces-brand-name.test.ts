/**
 * What the business is called goes to the backend with its description, and only then
 * (rext-control task 922): a workspace made or set up from a description that names no business
 * had no brand name, and its articles never named it. A website names its own brand.
 */

import type { ApiClient } from "@/lib/api-client/core";
import { createWorkspacesNamespace } from "@/lib/api-client/workspaces";

const request = jest.fn();
const workspaces = createWorkspacesNamespace({
  request,
} as unknown as ApiClient);
/** The body of the one request sent. */
const sent = () => JSON.parse(request.mock.calls[0][1].body as string);
const SAID = "We bake sourdough for cafes and families in Leeds.";

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({ operation_id: "op-1" });
});

describe("creating a workspace", () => {
  it("sends the business's name with a description", async () => {
    await workspaces.create({
      name: "Luna Bakery",
      description: SAID,
      brand_name: "  Luna Bakery ",
    });

    expect(sent()).toEqual({
      name: "Luna Bakery",
      description: SAID,
      brand_name: "Luna Bakery",
    });
  });

  it("sends none with a website", async () => {
    await workspaces.create({
      name: "Luna Bakery",
      url: "https://lunabakery.com",
      brand_name: "Luna Bakery",
    });

    expect(sent()).toEqual({
      name: "Luna Bakery",
      url: "https://lunabakery.com",
    });
  });

  it("sends none with a name alone, or when it is blank", async () => {
    await workspaces.create({ name: "Ana's workspace", brand_name: "Ana" });
    expect(sent()).toEqual({ name: "Ana's workspace" });

    request.mockClear();
    await workspaces.create({
      name: "Luna Bakery",
      description: SAID,
      brand_name: "   ",
    });
    expect(sent()).toEqual({ name: "Luna Bakery", description: SAID });
  });
});

describe("setting a workspace up from a description", () => {
  it("sends the business's name beside it", async () => {
    await workspaces.describeLater("w1", ` ${SAID} `, " Luna Bakery ");

    expect(request.mock.calls[0][0]).toContain("w1");
    expect(sent()).toEqual({ description: SAID, brand_name: "Luna Bakery" });
  });

  it("sends the description alone when no name was given", async () => {
    await workspaces.describeLater("w1", SAID);
    expect(sent()).toEqual({ description: SAID });

    request.mockClear();
    await workspaces.describeLater("w1", SAID, "  ");
    expect(sent()).toEqual({ description: SAID });
  });
});
