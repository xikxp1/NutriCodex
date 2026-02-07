import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as SonnerModule from "@/components/ui/sonner";

describe("Sonner Toaster component exports", () => {
  it("exports Toaster as a function", () => {
    expect(typeof SonnerModule.Toaster).toBe("function");
  });
});

describe("Sonner Toaster rendering", () => {
  it("renders without crashing", () => {
    const { container } = render(<SonnerModule.Toaster />);
    expect(container).toBeTruthy();
  });

  it("accepts position prop", () => {
    const { container } = render(<SonnerModule.Toaster position="top-right" />);
    expect(container).toBeTruthy();
  });

  it("accepts offset prop", () => {
    const { container } = render(<SonnerModule.Toaster offset="3.5rem" />);
    expect(container).toBeTruthy();
  });
});
