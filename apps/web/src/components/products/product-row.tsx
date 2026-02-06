import { Package } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export type ProductWithImageUrl = {
  _id: string;
  name: string;
  macronutrients: { calories: number; protein: number; carbs: number; fat: number };
  imageUrl: string | null;
  source: "manual" | "openfoodfacts";
  barcode?: string;
};

export function ProductRow({
  product,
  onClick,
}: {
  product: ProductWithImageUrl;
  onClick: () => void;
}) {
  const { macronutrients } = product;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent"
    >
      <Avatar size="lg">
        {product.imageUrl ? (
          <AvatarImage src={product.imageUrl} alt={product.name} className="object-cover" />
        ) : null}
        <AvatarFallback>
          <Package className="size-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{product.name}</span>
        <span className="text-xs text-muted-foreground">
          {macronutrients.calories} kcal &middot; {macronutrients.protein}g protein &middot;{" "}
          {macronutrients.carbs}g carbs &middot; {macronutrients.fat}g fat
        </span>
      </div>
    </button>
  );
}
