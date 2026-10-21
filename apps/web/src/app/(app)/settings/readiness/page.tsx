import { notFound } from "next/navigation";
import { ReadinessChecklist } from "@/components/readiness/ReadinessChecklist";
import { readinessPageEnabled } from "@/lib/readiness";

export const metadata = {
  title: "Mainnet readiness | Stolla",
};

/**
 * Operator-only mainnet readiness checklist, mirroring the gates in
 * docs/testnet-to-mainnet-runbook.md. Hidden (404) unless the exact public
 * build flag NEXT_PUBLIC_SHOW_READINESS=1 is set.
 */
export default function ReadinessPage() {
  if (!readinessPageEnabled()) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-100">Mainnet readiness</h1>
      <p className="mt-2 text-sm text-slate-400">
        Live pass/fail status for the gates in the testnet-to-mainnet runbook,
        derived from current environment configuration and{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5">/api/health</code>.
        Gates that require human judgment are marked &quot;Manual check&quot;
        with a link to the relevant runbook section.
      </p>
      <div className="mt-6">
        <ReadinessChecklist />
      </div>
    </div>
  );
}
