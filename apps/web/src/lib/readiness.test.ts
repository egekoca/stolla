import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReadinessGates, readinessPageEnabled, type ReadinessHealth } from "@/lib/readiness";

const healthyResponse: ReadinessHealth = {
  network: { selected: "testnet", passphraseConfigured: true },
  contracts: { allConfigured: true },
  capabilities: {
    rpc: true,
    explorer: true,
    communityFactory: true,
    proposalDiscovery: true,
  },
};

describe("readinessPageEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled when the flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_READINESS", "");
    expect(readinessPageEnabled()).toBe(false);
  });

  it("is disabled for any value other than the exact string \"1\"", () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_READINESS", "true");
    expect(readinessPageEnabled()).toBe(false);
  });

  it("is enabled only for the exact string \"1\"", () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_READINESS", "1");
    expect(readinessPageEnabled()).toBe(true);
  });
});

describe("buildReadinessGates", () => {
  it("reports every automated gate as passing for a fully healthy response", () => {
    const gates = buildReadinessGates(healthyResponse);
    const automated = gates.filter((gate) => gate.status !== "manual");

    expect(automated.every((gate) => gate.status === "pass")).toBe(true);
    expect(automated.every((gate) => gate.detail === undefined)).toBe(true);
  });

  it("always includes the two manual gates regardless of health", () => {
    const gates = buildReadinessGates(healthyResponse);
    const manual = gates.filter((gate) => gate.status === "manual").map((g) => g.id);

    expect(manual).toEqual(
      expect.arrayContaining(["mainnet-writes-gate", "ci-pipeline"]),
    );
  });

  it("names the missing capability when the network passphrase is unconfigured", () => {
    const gates = buildReadinessGates({
      ...healthyResponse,
      network: { selected: "mainnet", passphraseConfigured: false },
    });

    const networkGate = gates.find((gate) => gate.id === "network-config");
    expect(networkGate?.status).toBe("fail");
    expect(networkGate?.detail).toContain("mainnet");
  });

  it("names the missing capability when rpc is unavailable", () => {
    const gates = buildReadinessGates({
      ...healthyResponse,
      capabilities: { ...healthyResponse.capabilities, rpc: false },
    });

    const rpcGate = gates.find((gate) => gate.id === "rpc");
    expect(rpcGate?.status).toBe("fail");
    expect(rpcGate?.detail).toMatch(/rpc/i);
  });

  it("passes the contracts gate when the community factory alone is configured", () => {
    const gates = buildReadinessGates({
      ...healthyResponse,
      contracts: { allConfigured: false },
      capabilities: { ...healthyResponse.capabilities, communityFactory: true },
    });

    const contractsGate = gates.find((gate) => gate.id === "contracts");
    expect(contractsGate?.status).toBe("pass");
  });

  it("fails the contracts gate when neither legacy contracts nor the factory are configured", () => {
    const gates = buildReadinessGates({
      ...healthyResponse,
      contracts: { allConfigured: false },
      capabilities: { ...healthyResponse.capabilities, communityFactory: false },
    });

    const contractsGate = gates.find((gate) => gate.id === "contracts");
    expect(contractsGate?.status).toBe("fail");
    expect(contractsGate?.detail).toBeTruthy();
  });

  it("every gate links to a runbook section", () => {
    const gates = buildReadinessGates(healthyResponse);
    expect(
      gates.every((gate) => gate.runbookUrl.includes("testnet-to-mainnet-runbook.md#")),
    ).toBe(true);
  });
});
