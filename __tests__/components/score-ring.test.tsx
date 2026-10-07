import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { ScoreRing } from "@/components/ui/score-ring";

describe("ScoreRing", () => {
  it("names itself in one SVG title, so the server's HTML hydrates as it is", async () => {
    const ring = <ScoreRing value={86} label="SEO score" />;
    const html = renderToString(ring);
    expect(html).toContain("<title>SEO score: 86 out of 100</title>");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const mismatches: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, ring, {
        onRecoverableError: (error) => mismatches.push(error),
      });
    });

    expect(mismatches).toEqual([]);
    container.remove();
  });
});
