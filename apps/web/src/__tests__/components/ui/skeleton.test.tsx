/**
 * Tests for ShadCN Skeleton component (sub-01)
 *
 * Requirements covered:
 * - Architecture: skeleton.tsx provides placeholder loading indicator
 * - NFR-1: ShadCN UI patterns with Tailwind styling and cn() utility
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Skeleton component", () => {
  it("renders a div element with skeleton styling", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe("DIV");
  });

  it("applies custom className via cn() utility", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton className="w-24 h-4" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain("w-24");
    expect(skeleton.className).toContain("h-4");
  });

  it("applies the animate-pulse class for loading animation", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain("animate-pulse");
  });

  it("applies rounded styling", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toMatch(/rounded/);
  });

  it("applies muted background color", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toMatch(/bg-/);
  });

  it("forwards additional HTML attributes", async () => {
    const { Skeleton } = await import("~/components/ui/skeleton");
    const { container } = render(<Skeleton data-testid="my-skeleton" aria-label="Loading" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute("data-testid", "my-skeleton");
    expect(skeleton).toHaveAttribute("aria-label", "Loading");
  });
});
