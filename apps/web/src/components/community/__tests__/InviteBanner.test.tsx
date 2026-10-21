import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useWallet: vi.fn(),
  searchParamsValue: "",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.searchParamsValue),
}));

vi.mock("@/context/WalletProvider", () => ({
  useWallet: mocks.useWallet,
}));

import { InviteBanner } from "@/components/community/InviteBanner";

describe("InviteBanner", () => {
  beforeEach(() => {
    mocks.useWallet.mockReturnValue({
      address: null,
      connect: vi.fn(),
      isConnecting: false,
    });
  });

  afterEach(() => {
    mocks.searchParamsValue = "";
  });

  it("renders nothing when there is no invite intent", () => {
    mocks.searchParamsValue = "";
    render(<InviteBanner communityName="Atlas" />);
    expect(screen.queryByRole("region", { name: "Invite" })).not.toBeInTheDocument();
  });

  it("renders the banner when invite=1 is present", () => {
    mocks.searchParamsValue = "invite=1";
    render(<InviteBanner communityName="Atlas" />);
    expect(screen.getByRole("region", { name: "Invite" })).toBeInTheDocument();
    expect(screen.getByText(/invited to Atlas/)).toBeInTheDocument();
  });

  it("prompts wallet connect when disconnected, and never renders an owner action", () => {
    mocks.searchParamsValue = "invite=1";
    mocks.useWallet.mockReturnValue({
      address: null,
      connect: vi.fn(),
      isConnecting: false,
    });

    render(<InviteBanner communityName="Atlas" />);

    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /owner/i })).not.toBeInTheDocument();
    expect(screen.getByText(/does not grant any owner or admin powers/i)).toBeInTheDocument();
  });

  it("calls connect when the connect button is clicked", () => {
    mocks.searchParamsValue = "invite=1";
    const connect = vi.fn();
    mocks.useWallet.mockReturnValue({ address: null, connect, isConnecting: false });

    render(<InviteBanner communityName="Atlas" />);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("shows a connected message instead of the connect button once a wallet is connected", () => {
    mocks.searchParamsValue = "invite=1";
    mocks.useWallet.mockReturnValue({
      address: "GCONNECTED",
      connect: vi.fn(),
      isConnecting: false,
    });

    render(<InviteBanner communityName="Atlas" />);

    expect(screen.queryByRole("button", { name: "Connect wallet" })).not.toBeInTheDocument();
    expect(screen.getByText(/wallet connected/i)).toBeInTheDocument();
  });

  it("is dismissible, and the invite query stays untouched (the link still works later)", () => {
    mocks.searchParamsValue = "invite=1";
    render(<InviteBanner communityName="Atlas" />);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss invite banner" }));

    expect(screen.queryByRole("region", { name: "Invite" })).not.toBeInTheDocument();
    expect(mocks.searchParamsValue).toBe("invite=1");
  });
});
