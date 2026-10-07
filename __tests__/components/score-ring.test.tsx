import { render, screen } from "@testing-library/react";
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

  it("draws the arc in one colour, or in the tone a levelled score gives it", () => {
    const { container, rerender } = render(
      <ScoreRing value={86} label="SEO score" />,
    );
    const arc = () => container.querySelectorAll("circle")[1];
    expect(arc()).toHaveClass("text-foreground");
    expect(screen.getByText("86")).toBeInTheDocument();

    rerender(
      <ScoreRing value={86} label="Keyword difficulty" tone="text-danger-700">
        <span>86%</span>
      </ScoreRing>,
    );
    expect(arc()).toHaveClass("text-danger-700");
    expect(arc()).not.toHaveClass("text-foreground");
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(screen.queryByText("86")).toBeNull();
  });

  it("is a 20 px mark with nothing inside when compact, still named for assistive technology", () => {
    const { container } = render(
      <ScoreRing value={42} label="Keyword difficulty" compact>
        <span>42%</span>
      </ScoreRing>,
    );

    expect(container.querySelector('[data-slot="score-ring"]')).toHaveClass(
      "size-5",
    );
    expect(
      screen.getByTitle("Keyword difficulty: 42 out of 100"),
    ).toBeInTheDocument();
    expect(screen.queryByText("42%")).toBeNull();
    expect(screen.queryByText("42")).toBeNull();
  });
});
