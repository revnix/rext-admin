/**
 * What the app says about a failure a person met (rext-control task 894): the error's class and
 * the address's shape, and nothing of the error's own words or of whose page it was.
 */
import fs from "node:fs";
import path from "node:path";
import {
  errorKind,
  errorProperties,
  pathShape,
  ROUTE_WORDS,
} from "@/lib/analytics-failures";
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

  it("drops a digest that is not a plain id", () => {
    const odd = Object.assign(new Error("x"), {
      digest: "see ana@example.com",
    });
    expect(errorProperties(odd)).toEqual({ error_kind: "Error" });
  });
});

describe("pathShape", () => {
  it("keeps the app's own words and turns every other part into a star", () => {
    expect(pathShape("/w/acme-corp/content/6f1c2d3e")).toBe("/w/*/content/*");
    expect(pathShape("/w/acme-corp/contnet")).toBe("/w/*/*");
    expect(pathShape("/settings/security")).toBe("/settings/security");
    expect(pathShape("/Admin/Users/")).toBe("/admin/users");
    expect(pathShape("/")).toBe("/");
    expect(pathShape("")).toBe("/");
  });

  it("says no more of a long address than its first six parts", () => {
    expect(pathShape("/w/a/content/b/c/d/e/f")).toBe("/w/*/content/*/*/*/…");
  });

  it("lets nothing of a person's through, whatever the address holds", () => {
    const shape = pathShape("/w/ana@example.com/personas/Ana%20Writer");
    expect(shape).toBe("/w/*/personas/*");
  });
});

describe("ROUTE_WORDS", () => {
  /** Every folder under app/ that is a fixed word of an address: not a parameter, a group or a private folder. */
  function words(dir: string, found = new Set<string>()): Set<string> {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      // The API's routes are no pages.
      if (dir.endsWith(`${path.sep}app`) && name === "api") continue;
      if (!/^[[(_@.]/.test(name)) found.add(name);
      words(path.join(dir, name), found);
    }
    return found;
  }

  it("holds every fixed part of the app's page addresses, so a new page can't fall out of the list", () => {
    const missing = [...words(path.join(process.cwd(), "app"))].filter(
      (word) => !ROUTE_WORDS.has(word),
    );
    expect(missing).toEqual([]);
  });
});
