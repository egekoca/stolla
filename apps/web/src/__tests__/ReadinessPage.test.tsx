import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: navigation.notFound,
}));

vi.mock("@/components/readiness/ReadinessChecklist", () => ({
  ReadinessChecklist: () => null,
}));

describe("(app)/settings/readiness page", () => {
  beforeEach(() => {
    navigation.notFound.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound when the flag is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_READINESS", "");
    const { default: ReadinessPage } = await import(
      "@/app/(app)/settings/readiness/page"
    );

    expect(() => ReadinessPage()).toThrow("NEXT_NOT_FOUND");
    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });

  it("renders normally when the flag is exactly \"1\"", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_READINESS", "1");
    const { default: ReadinessPage } = await import(
      "@/app/(app)/settings/readiness/page"
    );

    expect(() => ReadinessPage()).not.toThrow();
    expect(navigation.notFound).not.toHaveBeenCalled();
  });
});
