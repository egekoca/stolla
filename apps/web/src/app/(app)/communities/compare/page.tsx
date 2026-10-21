"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppLinkButton } from "@/components/ui/AppLinkButton";
import { LiveStatus } from "@/components/ui/LiveStatus";
import { Skeleton } from "@/components/ui/Skeleton";
import { communityRegistry } from "@/lib/community/registry";
import { buildCompareRows, parseCompareIds, type CompareRow } from "@/lib/community/compare";
import type { Community } from "@/lib/community/types";

type LoadState =
  | { status: "loading" }
  | { status: "not-found"; missingIds: string[] }
  | { status: "error"; message: string }
  | { status: "loaded"; left: Community; right: Community };

async function loadCommunity(id: string): Promise<Community | { notFound: true }> {
  const result = await communityRegistry.get(id);
  if (result.status === "found") return result.community;
  return { notFound: true };
}

export default function CompareCommunitiesPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const ids = useMemo(() => parseCompareIds(idsParam), [idsParam]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;

    async function run(pair: [string, string]) {
      setState({ status: "loading" });

      try {
        const [leftResult, rightResult] = await Promise.all([
          loadCommunity(pair[0]),
          loadCommunity(pair[1]),
        ]);
        if (cancelled) return;

        const missingIds: string[] = [];
        if ("notFound" in leftResult) missingIds.push(pair[0]);
        if ("notFound" in rightResult) missingIds.push(pair[1]);

        if (missingIds.length > 0) {
          setState({ status: "not-found", missingIds });
          return;
        }

        setState({
          status: "loaded",
          left: leftResult as Community,
          right: rightResult as Community,
        });
      } catch {
        if (cancelled) return;
        setState({
          status: "error",
          message: "Could not load one or both communities. Try again.",
        });
      }
    }

    void run(ids);

    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!ids) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-100">Compare communities</h1>
        <div className="mt-6">
          <LiveStatus tone="error">
            Provide exactly two different community ids to compare, e.g.{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5">
              /communities/compare?ids=&lt;id-a&gt;,&lt;id-b&gt;
            </code>
            .
          </LiveStatus>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-100">Compare communities</h1>
      <p className="mt-2 text-sm text-slate-400">
        Governance parameters and basic metadata for two registry communities,
        side by side.
      </p>

      <div className="mt-6">
        {state.status === "loading" && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        )}

        {state.status === "not-found" && (
          <LiveStatus tone="error">
            {state.missingIds.length === 2
              ? `Neither community was found: ${state.missingIds.join(", ")}.`
              : `Community not found: ${state.missingIds[0]}.`}
          </LiveStatus>
        )}

        {state.status === "error" && <LiveStatus tone="error">{state.message}</LiveStatus>}

        {state.status === "loaded" && (
          <CompareTable left={state.left} right={state.right} />
        )}
      </div>
    </div>
  );
}

function CompareTable({ left, right }: { left: Community; right: Community }) {
  const rows = buildCompareRows(left, right);
  const leftName = left.metadata?.name ?? left.record.id;
  const rightName = right.metadata?.name ?? right.record.id;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="sr-only">
            Governance parameter comparison between {leftName} and {rightName}
          </caption>
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th scope="col" className="px-4 py-3 font-medium">
                Parameter
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {leftName}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {rightName}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CompareRowLine key={row.key} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3">
        <AppLinkButton href={`/communities/${left.record.id}`} tone="secondary">
          View {leftName}
        </AppLinkButton>
        <AppLinkButton href={`/communities/${right.record.id}`} tone="secondary">
          View {rightName}
        </AppLinkButton>
      </div>
    </div>
  );
}

function CompareRowLine({ row }: { row: CompareRow }) {
  return (
    <tr className={`border-b border-slate-800/60 last:border-0 ${row.differs ? "bg-amber-950/30" : ""}`}>
      <th scope="row" className="px-4 py-3 font-medium text-slate-300">
        {row.label}
      </th>
      <td className="px-4 py-3 text-slate-200">
        {row.left ?? <span className="text-slate-500">—</span>}
      </td>
      <td className="px-4 py-3 text-slate-200">
        {row.right ?? <span className="text-slate-500">—</span>}
        {row.differs && (
          <span className="ml-2 rounded-full border border-amber-700 px-2 py-0.5 text-xs text-amber-300">
            differs
          </span>
        )}
      </td>
    </tr>
  );
}
