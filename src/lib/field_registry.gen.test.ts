import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("generated field registry", () => {
  it("matches the YAML source hash", () => {
    const yaml = readFileSync("../ai-service/config/candidates/field_registry.yaml");
    const generated = readFileSync("src/lib/field_registry.gen.ts", "utf8");
    expect(generated).toContain(`sha256 ${createHash("sha256").update(yaml).digest("hex")}`);
  });
});
