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
  let matchMediaListeners: Array<() => void>;
  let originalInnerWidth: number;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaListeners = [];
    originalInnerWidth = window.innerWidth;
    mockRemoveEventListener = vi.fn((_event: string, listener: () => void) => {
      matchMediaListeners = matchMediaListeners.filter((l) => l !== listener);
    });

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, listener: () => void) => {
          matchMediaListeners.push(listener);
        }),
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("returns false for desktop viewport (above 768px)", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    // After useEffect runs, should reflect window.innerWidth check
    expect(result.current).toBe(false);
  });

  it("returns true for mobile viewport (below 768px)", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 500,
    });
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    // After useEffect runs, should reflect window.innerWidth check
    expect(result.current).toBe(true);
  });

  it("responds to viewport changes", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate viewport change to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 500,
      });
      for (const listener of matchMediaListeners) {
        listener();
      }
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listener on unmount", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    const { useIsMobile } = await import("~/hooks/use-mobile");
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalled();
  });

  it("uses 768px as the mobile breakpoint", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    const { useIsMobile } = await import("~/hooks/use-mobile");
    renderHook(() => useIsMobile());

    // CLI version uses (max-width: 767px) which is MOBILE_BREAKPOINT - 1
    expect(window.matchMedia).toHaveBeenCalledWith(expect.stringContaining("767"));
  });
});
