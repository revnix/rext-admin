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

function renderTable(cardsBelow?: "sm" | "lg") {
  render(
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="People"
      renderCard={(row) => <p>{row.name}</p>}
      cardsBelow={cardsBelow}
    />,
  );
  const table = screen.getByRole("table").closest("div.hidden");
  const cards = screen.getByRole("list", { name: "People" });
  return { table, cards };
}

describe("DataTable cards", () => {
  it("draws cards under 640 px and the table above, by default", () => {
    const { table, cards } = renderTable();
    expect(table).toHaveClass("sm:block");
    expect(cards).toHaveClass("sm:hidden");
  });

  it("keeps the cards up to 1024 px for a table in a narrow column", () => {
    const { table, cards } = renderTable("lg");
    expect(table).toHaveClass("lg:block");
    expect(table).not.toHaveClass("sm:block");
    expect(cards).toHaveClass("lg:hidden");
    expect(cards).not.toHaveClass("sm:hidden");
  });
});
