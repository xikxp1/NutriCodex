import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ManualProductForm } from "./manual-product-form";

export function AddProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Create a new product manually or import from OpenFoodFacts.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              Manual
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              Import
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <ManualProductForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="import">
            <p className="text-muted-foreground py-4 text-sm">OpenFoodFacts import coming soon.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
