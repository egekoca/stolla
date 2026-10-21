import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("exposes Product, Resources, and Network as h2 section headings", () => {
    render(<Footer />);

    expect(screen.getByRole("heading", { level: 2, name: "Product" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Resources" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Network" })).toBeInTheDocument();
  });
});
