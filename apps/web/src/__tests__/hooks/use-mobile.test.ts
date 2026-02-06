/**
 * Tests for useIsMobile hook (sub-01)
 *
 * Requirements covered:
 * - Architecture: useIsMobile detects viewport below 768px breakpoint
 * - NFR-3: SSR-compatible, no window/document access during server rendering
 * - Used by SidebarProvider to switch between desktop sidebar and mobile sheet
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useIsMobile hook", () => {
  let matchMediaListeners: Array<(event: { matches: boolean }) => void>;
  let currentMatches: boolean;

  beforeEach(() => {
    matchMediaListeners = [];
    currentMatches = false;

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: currentMatches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(
          (_event: string, listener: (event: { matches: boolean }) => void) => {
            matchMediaListeners.push(listener);
          },
        ),
        removeEventListener: vi.fn(
          (_event: string, listener: (event: { matches: boolean }) => void) => {
            matchMediaListeners = matchMediaListeners.filter((l) => l !== listener);
          },
        ),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for desktop viewport (above 768px)", async () => {
    currentMatches = false;
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    // After useEffect runs, should reflect matchMedia result
    expect(result.current).toBe(false);
  });

  it("returns true for mobile viewport (below 768px)", async () => {
    currentMatches = true;
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    // After useEffect runs, should reflect matchMedia result
    expect(result.current).toBe(true);
  });

  it("responds to viewport changes", async () => {
    currentMatches = false;
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate viewport change to mobile
    act(() => {
      for (const listener of matchMediaListeners) {
        listener({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", async () => {
    currentMatches = false;
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { unmount } = renderHook(() => useIsMobile());

    const removeEventListenerMock = window.matchMedia("").removeEventListener;

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalled();
  });

  it("uses 768px as the mobile breakpoint", async () => {
    currentMatches = false;
    const { useIsMobile } = await import("~/hooks/use-mobile");
    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith(expect.stringContaining("768"));
  });
});
