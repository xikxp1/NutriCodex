import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as AlertDialogModule from "@/components/ui/alert-dialog";

describe("AlertDialog component exports", () => {
  const requiredExports = [
    "AlertDialog",
    "AlertDialogTrigger",
    "AlertDialogPortal",
    "AlertDialogOverlay",
    "AlertDialogContent",
    "AlertDialogHeader",
    "AlertDialogTitle",
    "AlertDialogDescription",
    "AlertDialogFooter",
    "AlertDialogAction",
    "AlertDialogCancel",
    "AlertDialogMedia",
  ] as const;

  for (const name of requiredExports) {
    it(`exports ${name} as a function`, () => {
      expect(typeof AlertDialogModule[name]).toBe("function");
    });
  }
});

describe("AlertDialog component rendering", () => {
  it("AlertDialogAction renders as a button", () => {
    render(
      <AlertDialogModule.AlertDialog open>
        <AlertDialogModule.AlertDialogContent>
          <AlertDialogModule.AlertDialogTitle>Title</AlertDialogModule.AlertDialogTitle>
          <AlertDialogModule.AlertDialogDescription>Desc</AlertDialogModule.AlertDialogDescription>
          <AlertDialogModule.AlertDialogFooter>
            <AlertDialogModule.AlertDialogAction>Confirm</AlertDialogModule.AlertDialogAction>
          </AlertDialogModule.AlertDialogFooter>
        </AlertDialogModule.AlertDialogContent>
      </AlertDialogModule.AlertDialog>,
    );
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("AlertDialogCancel renders as a button", () => {
    render(
      <AlertDialogModule.AlertDialog open>
        <AlertDialogModule.AlertDialogContent>
          <AlertDialogModule.AlertDialogTitle>Title</AlertDialogModule.AlertDialogTitle>
          <AlertDialogModule.AlertDialogDescription>Desc</AlertDialogModule.AlertDialogDescription>
          <AlertDialogModule.AlertDialogFooter>
            <AlertDialogModule.AlertDialogCancel>Cancel</AlertDialogModule.AlertDialogCancel>
          </AlertDialogModule.AlertDialogFooter>
        </AlertDialogModule.AlertDialogContent>
      </AlertDialogModule.AlertDialog>,
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("components use data-slot attributes", () => {
    render(
      <AlertDialogModule.AlertDialog open>
        <AlertDialogModule.AlertDialogContent data-testid="content">
          <AlertDialogModule.AlertDialogHeader data-testid="header">
            <AlertDialogModule.AlertDialogTitle data-testid="title">
              Title
            </AlertDialogModule.AlertDialogTitle>
            <AlertDialogModule.AlertDialogDescription data-testid="description">
              Description
            </AlertDialogModule.AlertDialogDescription>
          </AlertDialogModule.AlertDialogHeader>
          <AlertDialogModule.AlertDialogFooter data-testid="footer">
            <AlertDialogModule.AlertDialogAction data-testid="action">
              OK
            </AlertDialogModule.AlertDialogAction>
          </AlertDialogModule.AlertDialogFooter>
        </AlertDialogModule.AlertDialogContent>
      </AlertDialogModule.AlertDialog>,
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "alert-dialog-content");
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "alert-dialog-header");
    expect(screen.getByTestId("title")).toHaveAttribute("data-slot", "alert-dialog-title");
    expect(screen.getByTestId("description")).toHaveAttribute(
      "data-slot",
      "alert-dialog-description",
    );
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "alert-dialog-footer");
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "alert-dialog-action");
  });
});
