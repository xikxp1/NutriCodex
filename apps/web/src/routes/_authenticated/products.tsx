import { useDebouncedValue } from "@tanstack/react-pacer";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { ProductList } from "~/components/products/product-list";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedFilter] = useDebouncedValue(inputValue, { wait: 300 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button disabled>
          <Plus />
          Add Product
        </Button>
      </div>

      <ProductList nameFilter={debouncedFilter} />
    </div>
  );
}
