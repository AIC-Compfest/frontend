import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TablePayloadView } from "./TablePayloadView";
import { asTablePayload } from "@/lib/review";

describe("TablePayloadView", () => {
  it("renders the selected table headers and all rows", () => {
    const payload = asTablePayload({ kind: "table", headers: ["Kode", "Barang"], rows: [{ cells: ["001", "Printer"] }, { cells: ["002", "Mouse"] }] });
    render(<TablePayloadView payload={payload!} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Kode")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("Mouse")).toBeInTheDocument();
  });

  it("normalizes invoice arrays of objects", () => {
    const payload = asTablePayload([{ item: "Printer", quantity: 2 }, { item: "Mouse", quantity: 5 }]);
    expect(payload?.headers).toEqual(["item", "quantity"]);
    render(<TablePayloadView payload={payload!} />);
    expect(screen.getAllByText("Printer")).toHaveLength(2);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
