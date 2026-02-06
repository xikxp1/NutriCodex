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

export function ManualProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const createProduct = useMutation(api.products.createProduct);

  const form = useForm({
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
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

        await createProduct({
          name: value.name,
          macronutrients: {
            calories: value.calories,
            protein: value.protein,
            carbs: value.carbs,
            fat: value.fat,
          },
          imageId: imageId as Parameters<typeof createProduct>[0]["imageId"],
        });

        toast.success("Product created successfully");
        onSuccess();
      } catch (err) {
        toast.error(
          (err as { data?: string })?.data ?? (err as Error)?.message ?? "Failed to create product",
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
      className="flex flex-col gap-4 pt-2"
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

      <Field>
        <FieldLabel>Image (optional)</FieldLabel>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
