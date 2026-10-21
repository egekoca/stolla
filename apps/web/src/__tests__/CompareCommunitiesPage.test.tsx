import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  searchParamsValue: "",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.searchParamsValue),
}));

vi.mock("@/lib/community/registry", () => ({
  communityRegistry: { get: mocks.get },
}));

import CompareCommunitiesPage from "@/app/(app)/communities/compare/page";

function makeCommunity(id: string, name: string, quorum: string) {
  return {
    record: {
      id,
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
    metadata: { schemaVersion: 1 as const, name, description: "", externalLinks: [] },
    metadataError: null,
    governance: {
      votingDelay: 100,
      votingPeriod: 1000,
      proposalThreshold: "500",
      quorum,
      unavailableFields: [],
    },
  };
}

describe("CompareCommunitiesPage", () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  afterEach(() => {
    mocks.searchParamsValue = "";
  });

  it("shows an actionable error when ids is missing", async () => {
    mocks.searchParamsValue = "";
    render(<CompareCommunitiesPage />);

    expect(await screen.findByText(/provide exactly two different community ids/i)).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("names the missing id when one community is not found", async () => {
    mocks.searchParamsValue = "ids=aa,bb";
    mocks.get.mockImplementation(async (id: string) =>
      id === "aa"
        ? { status: "found", community: makeCommunity("aa", "Atlas", "2000") }
        : { status: "not-found" },
    );

    render(<CompareCommunitiesPage />);

    expect(await screen.findByText(/community not found: bb/i)).toBeInTheDocument();
  });

  it("renders a compare table with a link back to each community when both are found", async () => {
    mocks.searchParamsValue = "ids=aa,bb";
    mocks.get.mockImplementation(async (id: string) =>
      id === "aa"
        ? { status: "found", community: makeCommunity("aa", "Atlas", "2000") }
        : { status: "found", community: makeCommunity("bb", "Borealis", "3000") },
    );

    render(<CompareCommunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Atlas").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Borealis").length).toBeGreaterThan(0);
    expect(screen.getAllByText("differs").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View Atlas" })).toHaveAttribute(
      "href",
      "/communities/aa",
    );
    expect(screen.getByRole("link", { name: "View Borealis" })).toHaveAttribute(
      "href",
      "/communities/bb",
    );
  });

  it("renders equal params without a differs badge", async () => {
    mocks.searchParamsValue = "ids=aa,bb";
    mocks.get.mockImplementation(async (id: string) =>
      id === "aa"
        ? { status: "found", community: makeCommunity("aa", "Atlas", "2000") }
        : { status: "found", community: makeCommunity("bb", "Atlas", "2000") },
    );

    render(<CompareCommunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Atlas").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("differs")).not.toBeInTheDocument();
  });
});
