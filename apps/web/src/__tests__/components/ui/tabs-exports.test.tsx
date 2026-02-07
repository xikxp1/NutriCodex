import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as TabsModule from "@/components/ui/tabs";

describe("Tabs component exports", () => {
  const requiredExports = ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] as const;

  for (const name of requiredExports) {
    it(`exports ${name} as a function`, () => {
      expect(typeof TabsModule[name]).toBe("function");
    });
  }

  it("exports tabsListVariants", () => {
    expect(typeof TabsModule.tabsListVariants).toBe("function");
  });
});

describe("Tabs component rendering", () => {
  it("renders a basic tabs setup with trigger and content", () => {
    render(
      <TabsModule.Tabs defaultValue="a">
        <TabsModule.TabsList>
          <TabsModule.TabsTrigger value="a">Tab A</TabsModule.TabsTrigger>
        </TabsModule.TabsList>
        <TabsModule.TabsContent value="a">Content A</TabsModule.TabsContent>
      </TabsModule.Tabs>,
    );
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  it("uses data-slot attributes on components", () => {
    render(
      <TabsModule.Tabs defaultValue="a" data-testid="tabs">
        <TabsModule.TabsList data-testid="tabs-list">
          <TabsModule.TabsTrigger value="a" data-testid="tabs-trigger">
            Tab A
          </TabsModule.TabsTrigger>
        </TabsModule.TabsList>
        <TabsModule.TabsContent value="a" data-testid="tabs-content">
          Content A
        </TabsModule.TabsContent>
      </TabsModule.Tabs>,
    );
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-slot", "tabs");
    expect(screen.getByTestId("tabs-list")).toHaveAttribute("data-slot", "tabs-list");
    expect(screen.getByTestId("tabs-trigger")).toHaveAttribute("data-slot", "tabs-trigger");
    expect(screen.getByTestId("tabs-content")).toHaveAttribute("data-slot", "tabs-content");
  });
});
