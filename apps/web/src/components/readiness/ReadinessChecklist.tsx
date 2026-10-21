"use client";

import { useEffect, useState } from "react";
import { LiveStatus } from "@/components/ui/LiveStatus";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildReadinessGates, type ReadinessGate, type ReadinessHealth } from "@/lib/readiness";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; gates: ReadinessGate[] };

const STATUS_LABEL: Record<ReadinessGate["status"], string> = {
  pass: "Pass",
  fail: "Fail",
  manual: "Manual check",
};

const STATUS_CLASS: Record<ReadinessGate["status"], string> = {
  pass: "border-emerald-700 bg-emerald-900/40 text-emerald-200",
  fail: "border-rose-700 bg-rose-900/40 text-rose-200",
  manual: "border-amber-700 bg-amber-900/40 text-amber-200",
};

export function ReadinessChecklist() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const body = (await response.json()) as ReadinessHealth;
        if (cancelled) return;
        setState({ status: "loaded", gates: buildReadinessGates(body) });
      } catch {
        if (cancelled) return;
        setState({
          status: "error",
          message: "Could not load /api/health. Check the dev server and try again.",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <LiveStatus tone="error">{state.message}</LiveStatus>;
  }

  const failing = state.gates.filter((gate) => gate.status === "fail");

  return (
    <div>
      <LiveStatus>
        {failing.length === 0
          ? "No automated gates are failing."
          : `${failing.length} gate${failing.length === 1 ? "" : "s"} failing: ${failing
              .map((gate) => gate.label)
              .join(", ")}.`}
      </LiveStatus>
      <ul className="mt-4 space-y-3">
        {state.gates.map((gate) => (
          <li
            key={gate.id}
            className={`rounded-lg border p-4 ${STATUS_CLASS[gate.status]}`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{gate.label}</span>
              <span className="rounded-full border border-current px-2 py-0.5 text-xs uppercase tracking-wide">
                {STATUS_LABEL[gate.status]}
              </span>
            </div>
            {gate.detail ? <p className="mt-2 text-sm">{gate.detail}</p> : null}
            <a
              href={gate.runbookUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline underline-offset-2"
            >
              Runbook section
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
