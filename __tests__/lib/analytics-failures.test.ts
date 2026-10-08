/**
 * What the app says about a failure a person met (rext-control task 894): the error's class and
 * the address's shape, and nothing of the error's own words or of whose page it was.
 */
import fs from "node:fs";
import path from "node:path";
import {
  errorKind,
  errorProperties,
  errorToastProperties,
  pathShape,
  ROUTE_TREE,
  type RouteTree,
} from "@/lib/analytics-failures";
import { setWords } from "@/lib/analytics-recording";
import { ApiError } from "@/lib/api-client/core";

describe("errorKind", () => {
  it("is the error's class when that is a plain name from the code", () => {
    expect(errorKind(new TypeError("Failed to fetch"))).toBe("TypeError");
    expect(errorKind(new ApiError(503, "Unavailable"))).toBe("ApiError");
    const chunk = new Error("Loading chunk 12 failed");
    chunk.name = "ChunkLoadError";
    expect(errorKind(chunk)).toBe("ChunkLoadError");
  });

  it("is other for anything else, a made-up name with text in it included", () => {
    const odd = new Error("x");
    odd.name = "Ana's workspace could not be read";
    expect(errorKind(odd)).toBe("other");
    expect(errorKind("a string was thrown")).toBe("other");
    expect(errorKind(null)).toBe("other");
  });
});

describe("errorProperties", () => {
  it("carries the class, the backend's status and a server error's digest, never the message", () => {
    const refused = new ApiError(403, "Workspace acme-corp is not yours");
    expect(errorProperties(refused)).toEqual({
      error_kind: "ApiError",
      status: 403,
    });

    const server = Object.assign(new Error("an email: ana@example.com"), {
      digest: "3721904455",
    });
    const sent = errorProperties(server);
    expect(sent).toEqual({ error_kind: "Error", digest: "3721904455" });
    expect(JSON.stringify(sent)).not.toContain("ana@example.com");
  });

  it("takes a status only from the API client's own error", () => {
    const lookalike = Object.assign(new Error("x"), { statusCode: 500 });
    expect(errorProperties(lookalike)).toEqual({ error_kind: "Error" });
    const odd = Object.assign(new Error("x"), {
      name: "ApiError",
      statusCode: "500 for ana@example.com",
    });
    expect(errorProperties(odd)).toEqual({ error_kind: "ApiError" });
  });

  it("drops a digest that is not a plain id", () => {
    const odd = Object.assign(new Error("x"), {
      digest: "see ana@example.com",
    });
    expect(errorProperties(odd)).toEqual({ error_kind: "Error" });
  });
});

describe("pathShape", () => {
  it("keeps a part only where the app's own routes have that word at that place", () => {
    expect(pathShape("/w/acme-corp/content/6f1c2d3e")).toBe("/w/*/content/*");
    expect(pathShape("/w/acme-corp/personas/6f1c/edit")).toBe(
      "/w/*/personas/*/edit",
    );
    expect(pathShape("/w/create")).toBe("/w/create");
    expect(pathShape("/settings/security")).toBe("/settings/security");
    expect(pathShape("/admin/users/")).toBe("/admin/users");
    expect(pathShape("/")).toBe("/");
    expect(pathShape("")).toBe("/");
  });

  it("turns what stands where a route takes a parameter into a star, whatever it says", () => {
    // A Library keyword that happens to be a word of the app's is still a person's keyword.
    expect(pathShape("/w/acme-corp/keywords/security")).toBe("/w/*/keywords/*");
    expect(pathShape("/w/acme-corp/keywords/pricing")).toBe("/w/*/keywords/*");
    // And so is a workspace that happens to be named after a page.
    expect(pathShape("/w/content/content")).toBe("/w/*/content");
    expect(pathShape("/w/settings")).toBe("/w/*");
    expect(pathShape("/edit/login/signup")).toBe("/edit/*/*");
  });

  it("turns everything past the routes the app has into stars", () => {
    expect(pathShape("/w/acme-corp/contnet")).toBe("/w/*/*");
    expect(pathShape("/w/acme-corp/contnet/settings/members")).toBe(
      "/w/*/*/*/*",
    );
    expect(pathShape("/login/admin/users")).toBe("/login/*/*");
    expect(pathShape("/Admin/Users")).toBe("/*/*");
    expect(pathShape("/*/w")).toBe("/*/*");
  });

  it("says no more of a long address than its first eight parts", () => {
    expect(pathShape("/w/a/content/b/c/d/e/f/g/h")).toBe(
      "/w/*/content/*/*/*/*/*/…",
    );
  });

  it("lets nothing of a person's through, whatever the address holds", () => {
    expect(pathShape("/w/ana@example.com/personas/Ana%20Writer")).toBe(
      "/w/*/personas/*",
    );
  });
});

describe("errorToastProperties", () => {
  const OWN = "Couldn't save. Try again.";

  beforeEach(() => {
    setWords([OWN]);
  });

  it("quotes one of the app's own sentences, with white space as the list holds it", () => {
    expect(errorToastProperties(3, `  ${OWN}  `, "/settings/security")).toEqual(
      {
        route: "/settings/security",
        own_words: true,
        message: OWN,
      },
    );
  });

  it("quotes nothing else: a backend's sentence, or a title that is not a text", () => {
    expect(
      errorToastProperties(4, "ana@example.com has no access", "/w/acme"),
    ).toEqual({ route: "/w/*", own_words: false });
    expect(errorToastProperties(5, { not: "a text" }, "/")).toEqual({
      route: "/",
      own_words: false,
    });
  });

  it("says nothing of whose words they were while the list hasn't been read", () => {
    setWords(null);
    expect(errorToastProperties(6, OWN, "/")).toEqual({ route: "/" });
  });

  it("keeps a name the code gave the toast, never a number or a text made into an id", () => {
    expect(errorToastProperties("upload-failed", OWN, "/").toast).toBe(
      "upload-failed",
    );
    expect(errorToastProperties(17, OWN, "/")).not.toHaveProperty("toast");
    expect(
      errorToastProperties("ana@example.com", OWN, "/"),
    ).not.toHaveProperty("toast");
  });
});

describe("ROUTE_TREE", () => {
  /**
   * The folders under app/ as a tree: a fixed folder under its own name, a parameter as "*", a
   * route group passed through, private folders and the API left out.
   */
  function tree(dir: string, top = true): RouteTree {
    const node: RouteTree = {};
    const merge = (into: RouteTree, from: RouteTree): RouteTree => {
      for (const [key, value] of Object.entries(from)) {
        into[key] = merge(into[key] ?? {}, value);
      }
      return into;
    };
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      const child = path.join(dir, name);
      if (top && name === "api") continue;
      if (/^[_@.]/.test(name)) continue;
      if (name.startsWith("(")) {
        merge(node, tree(child, false));
        continue;
      }
      const key = name.startsWith("[") ? "*" : name;
      node[key] = merge(node[key] ?? {}, tree(child, false));
    }
    return node;
  }

  /** A tree with its parts in one order, to print and to compare. */
  const sorted = (node: RouteTree): RouteTree =>
    Object.fromEntries(
      Object.keys(node)
        .sort()
        .map((key) => [key, sorted(node[key])]),
    );

  it("is the app's pages as the folders lay them out, so a new page can't fall out of it", () => {
    const folders = sorted(tree(path.join(process.cwd(), "app")));
    // A page was added, moved or removed: the message is the tree to paste in its place.
    if (JSON.stringify(folders) !== JSON.stringify(sorted(ROUTE_TREE))) {
      throw new Error(
        `ROUTE_TREE in lib/analytics-failures.ts no longer matches the folders under app/. Replace it with:\n${JSON.stringify(folders)}`,
      );
    }
    expect(sorted(ROUTE_TREE)).toEqual(folders);
  });
});
