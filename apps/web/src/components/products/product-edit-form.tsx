import type { Id } from "@nutricodex/backend";
import { api } from "@nutricodex/backend";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

import { productFormSchema } from "./product-schema";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type ProductDoc = {
  _id: string;
  name: string;
  macronutrients: { calories: number; protein: number; carbs: number; fat: number };
  imageUrl: string | null;
  imageId?: string;
  source: "manual" | "openfoodfacts";
  barcode?: string;
};

export function ProductEditForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: ProductDoc;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const updateProduct = useMutation(api.products.updateProduct);

  const form = useForm({
    defaultValues: {
      name: product.name,
      calories: product.macronutrients.calories,
      protein: product.macronutrients.protein,
      carbs: product.macronutrients.carbs,
      fat: product.macronutrients.fat,
    },
    validators: {
      onSubmit: productFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (imageFile) {
          if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
            toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
            return;
          }
          if (imageFile.size > MAX_FILE_SIZE) {
            toast.error("File too large. Maximum size is 5MB.");
            return;
          }
        }

        let imageId: string | undefined;

        if (imageFile) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": imageFile.type },
            body: imageFile,
          });
          const json = await result.json();
          imageId = json.storageId;
        }

        await updateProduct({
          productId: product._id as Id<"product">,
          name: value.name,
          macronutrients: {
            calories: value.calories,
            protein: value.protein,
            carbs: value.carbs,
            fat: value.fat,
          },
          ...(imageId ? { imageId: imageId as Id<"_storage"> } : {}),
          ...(shouldRemoveImage ? { removeImage: true } : {}),
        });

        toast.success("Product updated");
        onSuccess();
      } catch (err) {
        toast.error(
          (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to update product",
        );
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="name">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <FieldError errors={field.state.meta.errors} />
            )}
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="calories">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Calories (kcal)</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="protein">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Protein (g)</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="carbs">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Carbs (g)</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field name="fat">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Fat (g)</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>
      </div>

      {product.imageUrl && !shouldRemoveImage && !imageFile && (
        <div className="flex items-center gap-3">
          <img src={product.imageUrl} alt="" className="size-16 rounded-lg object-cover" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShouldRemoveImage(true)}
          >
            Remove Image
          </Button>
        </div>
      )}

      {(shouldRemoveImage || !product.imageUrl || imageFile) && (
        <Field>
          <FieldLabel>Image (optional)</FieldLabel>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setImageFile(e.target.files?.[0] ?? null);
              setShouldRemoveImage(false);
            }}
          />
        </Field>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
