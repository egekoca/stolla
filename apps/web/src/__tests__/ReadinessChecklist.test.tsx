import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReadinessChecklist } from "@/components/readiness/ReadinessChecklist";

const healthyBody = {
  network: { selected: "testnet", passphraseConfigured: true },
  contracts: { allConfigured: true },
  capabilities: {
    rpc: true,
    explorer: true,
    communityFactory: true,
    proposalDiscovery: true,
  },
};

describe("ReadinessChecklist", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every gate once /api/health resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => healthyBody,
      }),
    );

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByText("Network passphrase configured")).toBeInTheDocument();
    });
    expect(screen.getByText("Mainnet writes explicitly gated")).toBeInTheDocument();
    expect(screen.getByText("No automated gates are failing.")).toBeInTheDocument();
  });

  it("names the failing capability when a gate fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          ...healthyBody,
          capabilities: { ...healthyBody.capabilities, rpc: false },
        }),
      }),
    );

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getAllByText("Fail").length).toBeGreaterThan(0);
    });
    expect(
      screen.getByText(/rpc capability is unavailable/i),
    ).toBeInTheDocument();
  });

  it("shows an error message when /api/health cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<ReadinessChecklist />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/could not load/i);
    });
  });
});
