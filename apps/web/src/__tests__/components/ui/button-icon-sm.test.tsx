/**
 * Tests for Button icon-sm size variant (sub-01)
 *
 * Requirements covered:
 * - Architecture: Button needs "icon-sm" variant for SidebarTrigger
 * - CLI-installed version uses "icon-sm": "size-8"
 * - Existing "icon" variant produces size-9
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Button icon-sm size variant", () => {
  it("renders with icon-sm size variant producing size-8 class", async () => {
    const { Button } = await import("~/components/ui/button");
    const { container } = render(<Button size="icon-sm">X</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("size-8");
  });

  it("renders with existing icon size variant producing size-9 class", async () => {
    const { Button } = await import("~/components/ui/button");
    const { container } = render(<Button size="icon">X</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("size-9");
  });

  it("exports buttonVariants with icon-sm in size variants", async () => {
    const { buttonVariants } = await import("~/components/ui/button");
    const iconSmClass = buttonVariants({ size: "icon-sm" });
    expect(iconSmClass).toContain("size-8");
  });

  it("does not break existing default size variant", async () => {
    const { Button } = await import("~/components/ui/button");
    const { container } = render(<Button>Click me</Button>);
    const button = container.firstChild as HTMLElement;
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("h-9");
  });
});
