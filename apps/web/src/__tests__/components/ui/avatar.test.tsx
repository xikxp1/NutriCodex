/**
 * Tests for ShadCN Avatar component (sub-02)
 *
 * Requirements covered:
 * - FR-8: Top bar shows current user's name or avatar
 * - Architecture: Avatar used in sidebar footer and top bar UserMenu
 * - NFR-1: ShadCN UI patterns with cn() utility
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Avatar component", () => {
  it("exports Avatar, AvatarImage, and AvatarFallback", async () => {
    const mod = await import("~/components/ui/avatar");
    expect(mod.Avatar).toBeDefined();
    expect(mod.AvatarImage).toBeDefined();
    expect(mod.AvatarFallback).toBeDefined();
  });

  it("renders Avatar container element", async () => {
    const { Avatar } = await import("~/components/ui/avatar");
    const { container } = render(<Avatar data-testid="avatar" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders AvatarFallback with initials when no image", async () => {
    const { Avatar, AvatarFallback } = await import("~/components/ui/avatar");
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("applies custom className to Avatar", async () => {
    const { Avatar } = await import("~/components/ui/avatar");
    const { container } = render(<Avatar className="h-10 w-10" />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toContain("h-10");
    expect(avatar.className).toContain("w-10");
  });

  it("applies rounded styling for circular avatar", async () => {
    const { Avatar } = await import("~/components/ui/avatar");
    const { container } = render(<Avatar />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toMatch(/rounded/);
  });
});
