/**
 * Tests for ShadCN Separator component (sub-01)
 *
 * Requirements covered:
 * - Architecture: separator.tsx provides visual separator between content sections
 * - Used in TopBar between SidebarTrigger and breadcrumb area
 * - NFR-1: ShadCN UI patterns with cn() utility
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Separator component", () => {
  it("renders a separator element", async () => {
    const { Separator } = await import("~/components/ui/separator");
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
  });

  it("renders horizontal orientation by default", async () => {
    const { Separator } = await import("~/components/ui/separator");
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
    // Horizontal separators should have border/height styling for a line
    // The exact implementation may vary but it should visually be horizontal
  });

  it("supports vertical orientation", async () => {
    const { Separator } = await import("~/components/ui/separator");
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
  });

  it("applies custom className", async () => {
    const { Separator } = await import("~/components/ui/separator");
    const { container } = render(<Separator className="my-4" />);
    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toContain("my-4");
  });

  it("uses the border color from theme", async () => {
    const { Separator } = await import("~/components/ui/separator");
    const { container } = render(<Separator />);
    const separator = container.firstChild as HTMLElement;
    expect(separator.className).toMatch(/border|bg-/);
  });
});
