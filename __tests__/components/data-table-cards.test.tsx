import { render, screen } from "@testing-library/react";
import {
  createDataTableColumnHelper,
  DataTable,
} from "@/components/ui/data-table";

type Row = { id: string; name: string };

const column = createDataTableColumnHelper<Row>();
const columns = column.columns([
  column.accessor((row) => row.name, { id: "name", header: "Name" }),
]);
const rows: Row[] = [{ id: "1", name: "Ada" }];

function renderTable(cardsWhen?: "phone" | "narrow") {
  const { container } = render(
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="People"
      renderCard={(row) => <p>{row.name}</p>}
      cardsWhen={cardsWhen}
    />,
  );
  const root = container.querySelector('[data-slot="data-table"]');
  const table = screen.getByRole("table").closest("div.hidden");
  const cards = screen.getByRole("list", { name: "People" });
  return { root, table, cards };
}

describe("DataTable cards", () => {
  it("draws cards under 640 px of screen and the table above, by default", () => {
    const { root, table, cards } = renderTable();
    expect(root).not.toHaveClass("@container");
    expect(table).toHaveClass("sm:block");
    expect(cards).toHaveClass("sm:hidden");
  });

  it("draws cards while the table's own box is narrow, whatever the screen", () => {
    const { root, table, cards } = renderTable("narrow");
    expect(root).toHaveClass("@container");
    expect(table).toHaveClass("@xl:block");
    expect(table).not.toHaveClass("sm:block");
    expect(cards).toHaveClass("@xl:hidden");
    expect(cards).not.toHaveClass("sm:hidden");
  });
});
