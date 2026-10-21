/**
 * Mainnet readiness checklist: mirrors the gates in
 * `docs/testnet-to-mainnet-runbook.md` as an in-app, operator-only page.
 *
 * Gates that can be derived from `/api/health` are checked automatically;
 * gates that require human judgment (CI status, the mainnet-writes flag
 * tracked separately by #356) are reported as `"manual"` with a pointer to
 * where to verify them.
 */

const RUNBOOK_URL =
  "https://github.com/stolla-labs/stolla/blob/main/docs/testnet-to-mainnet-runbook.md";

export type ReadinessGateStatus = "pass" | "fail" | "manual";

export type ReadinessGate = {
  id: string;
  label: string;
  status: ReadinessGateStatus;
  /** Present when status is "fail" or "manual": names what's missing or what to verify by hand. */
  detail?: string;
  runbookUrl: string;
};

/** Minimal shape of the `/api/health` response this checklist depends on. */
export type ReadinessHealth = {
  network: { selected: string; passphraseConfigured: boolean };
  contracts: { allConfigured: boolean };
  capabilities: {
    rpc: boolean;
    explorer: boolean;
    communityFactory: boolean;
    proposalDiscovery: boolean;
  };
};

/**
 * Returns `true` only when the exact public build flag
 * `NEXT_PUBLIC_SHOW_READINESS=1` is set. Any other value, including unset,
 * keeps the readiness page hidden.
 */
export function readinessPageEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_READINESS === "1";
}

/**
 * Builds the readiness gate table from a `/api/health` response. Pure and
 * synchronous so it can be unit tested without a network call.
 */
export function buildReadinessGates(health: ReadinessHealth): ReadinessGate[] {
  return [
    {
      id: "network-config",
      label: "Network passphrase configured",
      status: health.network.passphraseConfigured ? "pass" : "fail",
      detail: health.network.passphraseConfigured
        ? undefined
        : `No network passphrase is configured for "${health.network.selected}".`,
      runbookUrl: `${RUNBOOK_URL}#gate-0-dependency-and-architecture-readiness`,
    },
    {
      id: "rpc",
      label: "RPC endpoint configured",
      status: health.capabilities.rpc ? "pass" : "fail",
      detail: health.capabilities.rpc
        ? undefined
        : "The rpc capability is unavailable — configure the Soroban RPC URL for this network.",
      runbookUrl: `${RUNBOOK_URL}#gate-0-dependency-and-architecture-readiness`,
    },
    {
      id: "contracts",
      label: "Contracts configured",
      status:
        health.contracts.allConfigured || health.capabilities.communityFactory
          ? "pass"
          : "fail",
      detail:
        health.contracts.allConfigured || health.capabilities.communityFactory
          ? undefined
          : "Neither the legacy contracts nor the community factory are fully configured.",
      runbookUrl: `${RUNBOOK_URL}#gate-2-reproducible-artifacts`,
    },
    {
      id: "explorer",
      label: "Explorer integration available",
      status: health.capabilities.explorer ? "pass" : "fail",
      detail: health.capabilities.explorer
        ? undefined
        : "The explorer capability is unavailable for this network.",
      runbookUrl: `${RUNBOOK_URL}#gate-3-testnet-pilot`,
    },
    {
      id: "proposal-discovery",
      label: "Proposal discovery indexing available",
      status: health.capabilities.proposalDiscovery ? "pass" : "fail",
      detail: health.capabilities.proposalDiscovery
        ? undefined
        : "The proposalDiscovery capability is unavailable for this network.",
      runbookUrl: `${RUNBOOK_URL}#gate-3-testnet-pilot`,
    },
    {
      id: "mainnet-writes-gate",
      label: "Mainnet writes explicitly gated",
      status: "manual",
      detail:
        "Tracked independently by issue #356 (ALLOW_MAINNET_WRITES or equivalent) — not yet enforced by this checklist.",
      runbookUrl: `${RUNBOOK_URL}#gate-4-mainnet-pre-deployment`,
    },
    {
      id: "ci-pipeline",
      label: "CI pipeline green on the release candidate",
      status: "manual",
      detail:
        "Verify the latest CI run for the release candidate in GitHub Actions — not derivable from runtime configuration.",
      runbookUrl: `${RUNBOOK_URL}#gate-1-release-candidate-quality`,
    },
  ];
}
