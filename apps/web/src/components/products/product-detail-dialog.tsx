import type { Id } from "@nutricodex/backend";
import { api } from "@nutricodex/backend";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";

import { ProductEditForm } from "./product-edit-form";

export function ProductDetailDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const product = useQuery(
    api.products.getProduct,
    productId ? { productId: productId as Id<"product"> } : "skip",
  );

  const deleteProduct = useMutation(api.products.deleteProduct);

  const handleDelete = async () => {
    if (!productId) return;
    setIsDeleting(true);
    try {
      await deleteProduct({ productId: productId as Id<"product"> });
      toast.success("Product deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to delete product",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsEditing(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {!product ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mx-auto h-48 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        ) : isEditing ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductEditForm
              product={product}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
            </DialogHeader>

            {product.imageUrl && (
              <div className="flex justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{product.macronutrients.calories}</p>
                <p className="text-muted-foreground text-xs">kcal</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{product.macronutrients.protein}g</p>
                <p className="text-muted-foreground text-xs">Protein</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{product.macronutrients.carbs}g</p>
                <p className="text-muted-foreground text-xs">Carbs</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{product.macronutrients.fat}g</p>
                <p className="text-muted-foreground text-xs">Fat</p>
              </div>
            </div>

            <div className="text-muted-foreground flex flex-col gap-1 text-sm">
              <p>Source: {product.source === "openfoodfacts" ? "OpenFoodFacts" : "Manual"}</p>
              {product.barcode && <p>Barcode: {product.barcode}</p>}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{product.name}&quot; and its image. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
