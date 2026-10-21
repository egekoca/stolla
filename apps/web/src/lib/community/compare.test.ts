import { describe, expect, it } from "vitest";
import { buildCompareRows, parseCompareIds } from "@/lib/community/compare";
import type { Community } from "@/lib/community/types";

function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    record: {
      id: "aa",
      nftContract: "C_NFT",
      governorContract: "C_GOV",
      creator: "GCREATOR",
      communityOwner: "GOWNER",
      createdAtLedger: 100,
      creationIndex: 0,
      metadataUri: "ipfs://x",
      metadataHash: "hash",
      metadataSchemaVersion: 1,
    },
    metadata: {
      schemaVersion: 1,
      name: "Atlas",
      description: "desc",
      externalLinks: [],
    },
    metadataError: null,
    governance: {
      votingDelay: 100,
      votingPeriod: 1000,
      proposalThreshold: "500",
      quorum: "2000",
      unavailableFields: [],
    },
    ...overrides,
  };
}

describe("parseCompareIds", () => {
  it("parses exactly two distinct, non-empty ids", () => {
    expect(parseCompareIds("aa,bb")).toEqual(["aa", "bb"]);
    expect(parseCompareIds(" aa , bb ")).toEqual(["aa", "bb"]);
  });

  it("returns null for a missing or empty parameter", () => {
    expect(parseCompareIds(null)).toBeNull();
    expect(parseCompareIds("")).toBeNull();
  });

  it("returns null for anything other than exactly two ids", () => {
    expect(parseCompareIds("aa")).toBeNull();
    expect(parseCompareIds("aa,bb,cc")).toBeNull();
    expect(parseCompareIds("aa,")).toBeNull();
  });

  it("returns null when both ids are the same", () => {
    expect(parseCompareIds("aa,aa")).toBeNull();
  });
});

describe("buildCompareRows", () => {
  it("marks equal params as not differing", () => {
    const a = makeCommunity();
    const b = makeCommunity({ record: { ...a.record, id: "bb" } });

    const rows = buildCompareRows(a, b);
    expect(rows.every((row) => row.differs === false)).toBe(true);
  });

  it("flags unequal params as differing", () => {
    const a = makeCommunity();
    const b = makeCommunity({
      record: { ...a.record, id: "bb" },
      governance: { ...a.governance, quorum: "3000" },
    });

    const rows = buildCompareRows(a, b);
    const quorumRow = rows.find((row) => row.key === "quorum");
    expect(quorumRow?.differs).toBe(true);

    const otherRows = rows.filter((row) => row.key !== "quorum");
    expect(otherRows.every((row) => row.differs === false)).toBe(true);
  });

  it("never flags a row as differing when either side is missing", () => {
    const a = makeCommunity({
      governance: { ...makeCommunity().governance, votingDelay: null },
    });
    const b = makeCommunity({ record: { ...a.record, id: "bb" } });

    const rows = buildCompareRows(a, b);
    const delayRow = rows.find((row) => row.key === "votingDelay");
    expect(delayRow?.left).toBeNull();
    expect(delayRow?.differs).toBe(false);
  });

  it("formats ledger-count fields with units", () => {
    const a = makeCommunity();
    const b = makeCommunity({ record: { ...a.record, id: "bb" } });

    const rows = buildCompareRows(a, b);
    const delayRow = rows.find((row) => row.key === "votingDelay");
    expect(delayRow?.left).toBe("100 ledgers");

    const singular = buildCompareRows(
      makeCommunity({ governance: { ...a.governance, votingDelay: 1 } }),
      b,
    );
    expect(singular.find((row) => row.key === "votingDelay")?.left).toBe("1 ledger");
  });
});
