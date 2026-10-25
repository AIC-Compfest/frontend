import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BatchHitlReviewModal } from "./BatchHitlReviewModal";
import fixture from "./__fixtures__/surat_jalan_variation_1.profile.json";

const mocks = vi.hoisted(() => ({
  getDocumentProfile: vi.fn(),
  finalizeDocumentBatch: vi.fn(),
  reprocessDocument: vi.fn(),
  reviewDocumentField: vi.fn(),
}));

vi.mock("@/lib/api", () => mocks);
vi.mock("@/lib/auth", () => ({ getStoredUser: () => null }));

const makePending = () => ({ ...fixture, decisions: [
  ...fixture.decisions.filter((decision) => decision.prediction_id !== "receiver-name"),
  { id: "pending-receiver", prediction_id: "receiver-name", decision_status: "PENDING_REVIEW", final_value: null as string | null },
] });

describe("BatchHitlReviewModal", () => {
  beforeEach(() => mocks.getDocumentProfile.mockResolvedValue(fixture));
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows clean mapped values, confidence, table rows, and a completed tab", async () => {
    render(<BatchHitlReviewModal documentIds={[fixture.document.id]} onClose={vi.fn()} onFinalized={vi.fn()} />);
    expect((await screen.findAllByText("PT. GEMILANG TIRTA ABADI")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("SDO202508000117").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PO-2025-0388").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Periksa manual").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /SURAT_JALAN.*✓/ })).toBeInTheDocument();
    const tableRow = screen.getAllByRole("row").find((row) => row.querySelector("td")?.textContent === "line_items");
    expect(tableRow).toBeDefined();
    expect(tableRow).not.toHaveTextContent("Periksa manual");
    const table = within(tableRow as HTMLElement).getByRole("table");
    expect(within(table).getByText("Kode Barang")).toBeInTheDocument();
    expect(within(table).getByText("Nama Barang")).toBeInTheDocument();
    expect(within(table).getByText("Jumlah Diretur")).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(Array.from(table.querySelectorAll("th, td")).every((cell) => (cell.textContent ?? "").length <= 160)).toBe(true);
    expect(screen.queryByText("LEGACY")).not.toBeInTheDocument();
  });

  it("enables accepting a receiver suggestion and warns on shipment_id", async () => {
    mocks.getDocumentProfile.mockResolvedValue(makePending());
    render(<BatchHitlReviewModal documentIds={[fixture.document.id]} onClose={vi.fn()} onFinalized={vi.fn()} />);
    await screen.findAllByText("Gudang Rungkut");
    const rows = screen.getAllByRole("row");
    const receiverRow = rows.find((row) => row.querySelector("td")?.textContent === "receiver_name");
    expect(receiverRow).toBeDefined();
    expect(within(receiverRow as HTMLElement).getByRole("button", { name: "Terima" })).toBeEnabled();
    const shipmentRow = rows.find((row) => row.querySelector("td")?.textContent === "shipment_id");
    expect(shipmentRow).toBeDefined();
    expect(within(shipmentRow as HTMLElement).getByText("Periksa manual")).toBeInTheDocument();
  });

  it("hides a malformed legacy scalar and offers reprocessing", async () => {
    const staleProfile = {
      ...fixture,
      predictions: fixture.predictions.map((prediction) => prediction.id === "sender-name"
        ? { ...prediction, predicted_value: "page spill ".repeat(25), predicted_raw_text: null }
        : prediction),
    };
    mocks.getDocumentProfile.mockResolvedValueOnce(staleProfile).mockResolvedValueOnce(fixture);
    mocks.reprocessDocument.mockResolvedValue(undefined);
    render(<BatchHitlReviewModal documentIds={[fixture.document.id]} onClose={vi.fn()} onFinalized={vi.fn()} />);
    expect(await screen.findByText("Mapping lama berisi nilai scalar yang tidak valid. Jalankan ulang AI sebelum menyetujui dokumen.")).toBeInTheDocument();
    expect(screen.queryByText(/page spill/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalisasi & buka review query" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Jalankan ulang AI" }));
    expect(mocks.reprocessDocument).toHaveBeenCalledWith(fixture.document.id);
  });
});
