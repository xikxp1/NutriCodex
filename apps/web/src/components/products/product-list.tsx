import { api } from "@nutricodex/backend";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePaginatedQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

import { Skeleton } from "~/components/ui/skeleton";

import { ProductDetailDialog } from "./product-detail-dialog";
import { ProductRow } from "./product-row";

export function ProductList({ nameFilter }: { nameFilter: string }) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.getProducts,
    { nameFilter: nameFilter || undefined },
    { initialNumItems: 20 },
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems.at(-1);
    if (!lastItem) return;
    if (lastItem.index >= results.length - 5 && status === "CanLoadMore") {
      loadMore(20);
    }
  }, [virtualItems, results.length, status, loadMore]);

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i.toString()}`} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={scrollContainerRef} className="h-[calc(100vh-12rem)] overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const product = results[virtualItem.index];
            return (
              <div
                key={product._id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ProductRow product={product} onClick={() => setSelectedProductId(product._id)} />
              </div>
            );
          })}
        </div>
      </div>

      <ProductDetailDialog
        productId={selectedProductId}
        open={selectedProductId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedProductId(null);
        }}
      />
    </>
  );
}
