import { fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceFavicon } from "@/components/shell/workspace-favicon";

describe("WorkspaceFavicon", () => {
  it("shows the site's favicon at 20 px", () => {
    const { container } = render(
      <WorkspaceFavicon name="Rext" src="https://media.test/rext.png" />,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://media.test/rext.png");
    expect(img).toHaveAttribute("width", "20");
    expect(img).toHaveAttribute("height", "20");
    expect(img?.className).toContain("object-contain");
  });

  it("falls back to the name's first letter without a favicon", () => {
    const { container } = render(<WorkspaceFavicon name="nextly" src={null} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("n")).toBeInTheDocument();
  });

  it("falls back to the letter when the favicon fails to load", () => {
    const { container } = render(
      <WorkspaceFavicon name="Revnix" src="https://media.test/gone.ico" />,
    );

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("R")).toBeInTheDocument();
  });
});
