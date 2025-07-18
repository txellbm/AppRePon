
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReponToast } from "@/hooks/use-repon-toast";
import { identifyProductsFromPhoto } from "@/lib/actions";
import { Upload, Loader2 } from "lucide-react";

interface IdentifyProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProducts: (productNames: string[]) => void;
}

type DialogState = "capture" | "processing";

export function IdentifyProductsDialog({ open, onOpenChange, onAddProducts }: IdentifyProductsDialogProps) {
  const { toast } = useReponToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogState, setDialogState] = useState<DialogState>("capture");

  useEffect(() => {
    if (open) {
      setDialogState("capture");
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleIdentify(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async (dataUri: string) => {
    setDialogState("processing");
    try {
      const result = await identifyProductsFromPhoto({ photoDataUri: dataUri });
      if (result.products.length > 0) {
        await (onAddProducts as any)(result.products);
        toast({ title: "Productos añadidos", description: `${result.products.length} producto(s) añadido(s) a tu despensa.` });
        onOpenChange(false);
      } else {
        toast({ title: "No se encontraron productos", description: "Prueba con otra foto más clara o con más productos.", variant: "destructive" });
        setDialogState("capture");
      }
    } catch (error) {
      toast({ title: "Error en la identificación", description: "No se pudieron identificar los productos.", variant: "destructive" });
      setDialogState("capture");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir desde foto</DialogTitle>
          <DialogDescription>
            {dialogState === 'capture' && "Haz una foto o selecciona una imagen de tus productos."}
            {dialogState === 'processing' && "Identificando productos en la imagen..."}
          </DialogDescription>
        </DialogHeader>

        {dialogState === 'capture' && (
          <div className="space-y-4">
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="mr-2" /> Hacer foto o subir imagen
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>
        )}

        {dialogState === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Analizando tu foto...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

    