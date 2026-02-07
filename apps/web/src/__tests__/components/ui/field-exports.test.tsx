import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as FieldModule from "@/components/ui/field";

describe("Field component exports", () => {
  const requiredExports = [
    "Field",
    "FieldContent",
    "FieldDescription",
    "FieldError",
    "FieldGroup",
    "FieldLabel",
    "FieldLegend",
    "FieldSeparator",
    "FieldSet",
    "FieldTitle",
  ] as const;

  for (const name of requiredExports) {
    it(`exports ${name} as a function`, () => {
      expect(typeof FieldModule[name]).toBe("function");
    });
  }
});

describe("FieldError rendering", () => {
  it("renders error messages when given errors prop", () => {
    render(<FieldModule.FieldError errors={[{ message: "Name is required" }]} />);
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("renders nothing when errors array is empty", () => {
    const { container } = render(<FieldModule.FieldError errors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when errors is undefined", () => {
    const { container } = render(<FieldModule.FieldError />);
    expect(container.innerHTML).toBe("");
  });
});

describe("Field data attributes", () => {
  it("Field supports data-invalid attribute", () => {
    render(
      <FieldModule.Field data-invalid="true" data-testid="field">
        <span>Content</span>
      </FieldModule.Field>,
    );
    expect(screen.getByTestId("field")).toHaveAttribute("data-invalid", "true");
  });

  it("Field has data-slot attribute", () => {
    render(
      <FieldModule.Field data-testid="field">
        <span>Content</span>
      </FieldModule.Field>,
    );
    expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "field");
  });
});
