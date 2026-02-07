import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as DialogModule from "@/components/ui/dialog";

describe("Dialog component exports", () => {
  const requiredExports = [
    "Dialog",
    "DialogTrigger",
    "DialogPortal",
    "DialogClose",
    "DialogOverlay",
    "DialogContent",
    "DialogHeader",
    "DialogFooter",
    "DialogTitle",
    "DialogDescription",
  ] as const;

  for (const name of requiredExports) {
    it(`exports ${name} as a function`, () => {
      expect(typeof DialogModule[name]).toBe("function");
    });
  }
});

describe("Dialog component rendering", () => {
  it("DialogContent accepts showCloseButton prop", () => {
    render(
      <DialogModule.Dialog open>
        <DialogModule.DialogContent showCloseButton={false}>
          <DialogModule.DialogTitle>Test</DialogModule.DialogTitle>
          <DialogModule.DialogDescription>Description</DialogModule.DialogDescription>
          <p>Content</p>
        </DialogModule.DialogContent>
      </DialogModule.Dialog>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("DialogHeader uses data-slot attribute", () => {
    render(<DialogModule.DialogHeader data-testid="header">Header</DialogModule.DialogHeader>);
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "dialog-header");
  });

  it("DialogFooter uses data-slot attribute", () => {
    render(<DialogModule.DialogFooter data-testid="footer">Footer</DialogModule.DialogFooter>);
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "dialog-footer");
  });

  it("DialogContent uses data-slot attribute", () => {
    render(
      <DialogModule.Dialog open>
        <DialogModule.DialogContent data-testid="content">
          <DialogModule.DialogTitle>Test</DialogModule.DialogTitle>
          <DialogModule.DialogDescription>Description</DialogModule.DialogDescription>
          <p>Inside</p>
        </DialogModule.DialogContent>
      </DialogModule.Dialog>,
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "dialog-content");
  });
});
