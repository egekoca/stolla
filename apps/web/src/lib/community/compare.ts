import type { Community } from "@/lib/community/types";

/** One row of the side-by-side governance/metadata comparison. */
export type CompareRow = {
  key: string;
  label: string;
  left: string | null;
  right: string | null;
  /** `true` when `left` and `right` are present and not equal. */
  differs: boolean;
};

function formatLedgerCount(value: number | null): string | null {
  if (value === null) return null;
  return `${value.toLocaleString()} ledger${value === 1 ? "" : "s"}`;
}

/**
 * Parses the `ids` query parameter (`?ids=a,b`) into exactly two distinct,
 * non-empty community ids. Returns `null` for anything else: missing,
 * fewer/more than two ids, blank entries, or two identical ids.
 */
export function parseCompareIds(raw: string | null): [string, string] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length !== 2) return null;
  if (ids[0] === ids[1]) return null;
  return [ids[0], ids[1]];
}

/**
 * Builds the side-by-side comparison rows for two communities' metadata and
 * governance parameters. Pure and synchronous; callers resolve the
 * `Community` records (and handle not-found ids) before calling this.
 */
export function buildCompareRows(left: Community, right: Community): CompareRow[] {
  const rows: Omit<CompareRow, "differs">[] = [
    {
      key: "name",
      label: "Name",
      left: left.metadata?.name ?? null,
      right: right.metadata?.name ?? null,
    },
    {
      key: "votingDelay",
      label: "Voting delay",
      left: formatLedgerCount(left.governance.votingDelay),
      right: formatLedgerCount(right.governance.votingDelay),
    },
    {
      key: "votingPeriod",
      label: "Voting period",
      left: formatLedgerCount(left.governance.votingPeriod),
      right: formatLedgerCount(right.governance.votingPeriod),
    },
    {
      key: "proposalThreshold",
      label: "Proposal threshold",
      left: left.governance.proposalThreshold,
      right: right.governance.proposalThreshold,
    },
    {
      key: "quorum",
      label: "Quorum",
      left: left.governance.quorum,
      right: right.governance.quorum,
    },
  ];

  return rows.map((row) => ({
    ...row,
    differs: row.left !== null && row.right !== null && row.left !== row.right,
  }));
}
