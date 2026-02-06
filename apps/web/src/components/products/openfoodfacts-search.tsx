import { api } from "@nutricodex/backend";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useAction } from "convex/react";
import { Package, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";

type OFFProduct = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string | null;
  barcode: string | null;
  brand: string | null;
};

type SearchResults = {
  products: OFFProduct[];
  totalCount: number;
  pageCount: number;
  page: number;
};

function OFFProductCard({
  product,
  onImport,
  isImporting,
}: {
  product: OFFProduct;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="size-10 rounded-md">
        {product.imageUrl && <AvatarImage src={product.imageUrl} alt={product.name} />}
        <AvatarFallback className="rounded-md">
          <Package className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{product.name}</span>
        {product.brand && (
          <span className="text-muted-foreground truncate text-xs">{product.brand}</span>
        )}
        <span className="text-muted-foreground text-xs">
          {product.calories} kcal · {product.protein}g P · {product.carbs}g C · {product.fat}g F
        </span>
      </div>

      <Button size="sm" variant="outline" onClick={onImport} disabled={isImporting}>
        {isImporting ? "Importing..." : "Import"}
      </Button>
    </div>
  );
}

export function OpenFoodFactsSearch({ onImported }: { onImported: () => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchInput, { wait: 300 });
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [importingBarcode, setImportingBarcode] = useState<string | null>(null);

  const searchOpenFoodFacts = useAction(api.products.searchOpenFoodFacts);
  const importProduct = useAction(api.products.importProduct);

  const prevQueryRef = useRef(debouncedQuery);

  // Search trigger -- also resets page to 1 when query changes
  useEffect(() => {
    // Reset to page 1 when the debounced query changes
    let page = currentPage;
    if (prevQueryRef.current !== debouncedQuery) {
      prevQueryRef.current = debouncedQuery;
      setCurrentPage(1);
      page = 1;
    }

    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    searchOpenFoodFacts({ query: debouncedQuery, page, pageSize: 10 })
      .then((data) => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error((err as { data?: string })?.data ?? "Search failed");
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentPage, searchOpenFoodFacts]);

  const handleImport = async (product: OFFProduct) => {
    setImportingBarcode(product.barcode);
    try {
      await importProduct({
        name: product.name,
        macronutrients: {
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
        },
        imageUrl: product.imageUrl ?? undefined,
        barcode: product.barcode ?? undefined,
      });
      toast.success(`Imported "${product.name}"`);
      onImported();
    } catch (err) {
      toast.error((err as { data?: string })?.data ?? (err as Error)?.message ?? "Import failed");
    } finally {
      setImportingBarcode(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search OpenFoodFacts..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {searchInput.length > 0 && searchInput.length < 2 && (
        <p className="text-muted-foreground text-sm">Enter at least 2 characters to search.</p>
      )}

      {isSearching && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isSearching && results && (
        <>
          {results.products.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">No products found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.products.map((product) => (
                <OFFProductCard
                  key={product.barcode ?? product.name}
                  product={product}
                  onImport={() => handleImport(product)}
                  isImporting={importingBarcode === product.barcode}
                />
              ))}
            </div>
          )}

          {results.pageCount > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {results.page} of {results.pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= results.pageCount}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
