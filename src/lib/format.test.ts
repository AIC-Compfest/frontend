import { describe, expect, it } from "vitest";
import { formatCompactIDR, formatIDR } from "./format";

// Intl puts a non-breaking space between the currency code and the amount. Normalize it for comparison.
const plain = (value: string) => value.replace(/\s/g, " ");

describe("formatIDR", () => {
  it("formats IDR with en-US grouping and no decimals", () => {
    expect(plain(formatIDR(1379797))).toBe("IDR 1,379,797");
    expect(plain(formatIDR(1379797.6))).toBe("IDR 1,379,798");
  });

  it("treats a missing amount as zero", () => {
    expect(plain(formatIDR(undefined))).toBe("IDR 0");
    expect(plain(formatIDR(null))).toBe("IDR 0");
  });
});

describe("formatCompactIDR", () => {
  it("uses B for billions, M for millions, and K for thousands", () => {
    expect(formatCompactIDR(2_500_000_000)).toBe("IDR 2.5B");
    expect(formatCompactIDR(1_300_000)).toBe("IDR 1.3M");
    expect(formatCompactIDR(450_000)).toBe("IDR 450K");
  });

  it("shows smaller amounts in full and handles missing values", () => {
    expect(formatCompactIDR(950)).toBe("IDR 950");
    expect(formatCompactIDR(null)).toBe("IDR 0");
    expect(formatCompactIDR(Number.NaN)).toBe("IDR 0");
  });
});
