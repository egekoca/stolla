import { describe, expect, it } from "vitest";
import { buildInviteUrl, hasInviteIntent } from "@/lib/invite";

describe("buildInviteUrl", () => {
  it("builds a canonical invite URL with the invite=1 marker", () => {
    expect(buildInviteUrl("ab12", "https://stolla.example")).toBe(
      "https://stolla.example/communities/ab12?invite=1",
    );
  });
});

describe("hasInviteIntent", () => {
  it("is true only for the exact invite=1 marker", () => {
    expect(hasInviteIntent(new URLSearchParams("invite=1"))).toBe(true);
  });

  it("is false when the parameter is missing", () => {
    expect(hasInviteIntent(new URLSearchParams(""))).toBe(false);
  });

  it("is false for any other value, including a stray signed-token-looking string", () => {
    expect(hasInviteIntent(new URLSearchParams("invite=true"))).toBe(false);
    expect(hasInviteIntent(new URLSearchParams("invite=eyJhbGciOi"))).toBe(false);
    expect(hasInviteIntent(new URLSearchParams("invite=0"))).toBe(false);
  });
});
