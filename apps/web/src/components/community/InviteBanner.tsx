"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/context/WalletProvider";
import { hasInviteIntent } from "@/lib/invite";

/**
 * "You've been invited" banner shown when a community detail page is
 * opened via an invite link (`?invite=1`). Purely presentational: it never
 * grants owner powers or bypasses wallet auth. Dismissing only hides the
 * banner for this render — the invite link itself keeps working if visited
 * again later.
 */
export function InviteBanner({ communityName }: { communityName: string }) {
  const searchParams = useSearchParams();
  const { address, connect, isConnecting } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !hasInviteIntent(searchParams)) return null;

  return (
    <div
      role="region"
      aria-label="Invite"
      className="mt-5 rounded-lg border border-indigo-700 bg-indigo-950/40 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-indigo-100">
            You&rsquo;ve been invited to {communityName}
          </p>
          <p className="mt-1 text-sm text-indigo-200">
            Connect your wallet to mint a membership or delegate your vote.
            This invite does not grant any owner or admin powers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss invite banner"
          className="shrink-0 rounded-lg border border-indigo-700 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-900/60"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-3">
        {address ? (
          <p className="text-sm text-indigo-200">
            Wallet connected — scroll down to mint a membership or delegate
            your vote.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={isConnecting}
            className="min-h-10 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:pointer-events-none disabled:opacity-50"
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
