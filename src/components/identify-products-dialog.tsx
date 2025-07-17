
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReponToast } from "@/hooks/use-repon-toast";
import { identifyProductsFromPhoto } from "@/lib/actions";
import { Camera, Upload, Check, Loader2, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface IdentifyProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProducts: (productNames: string[]) => void;
}

type DialogState = "capture" | "processing" | "confirm";

export function IdentifyProductsDialog({ open, onOpenChange, onAddProducts }: IdentifyProductsDialogProps) {
  const { toast } = useReponToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialogState, setDialogState] = useState<DialogState>("capture");
  const [identifiedProducts, setIdentifiedProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const resetState = () => {
    setDialogState("capture");
    setIdentifiedProducts([]);
    setSelectedProducts(new Set());
  };

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);

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
      console.error("Identification failed", error);
      toast({ title: "Error en la identificación", description: "No se pudieron identificar los productos.", variant: "destructive" });
      setDialogState("capture");
    }
  };
  
  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      stream.getTracks().forEach((t) => t.stop());

      const reader = new FileReader();
      reader.onloadend = () => handleIdentify(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error capturing photo", err);
    }
  };

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

  const handleProductSelection = (productName: string, isChecked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(productName);
      } else {
        newSet.delete(productName);
      }
      return newSet;
    });
  };

  const handleAddClick = () => {
    onAddProducts(Array.from(selectedProducts));
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir desde foto</DialogTitle>
          <DialogDescription>
            {dialogState === 'capture' && "Usa tu cámara o sube una foto de tus productos."}
            {dialogState === 'processing' && "Identificando productos en la imagen..."}
            {dialogState === 'confirm' && "Confirma los productos a añadir a tu despensa."}
          </DialogDescription>
        </DialogHeader>

        {dialogState === 'capture' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCapture} className="w-full">
                <Camera className="mr-2" /> Tomar Foto
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2" /> Subir Imagen
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        )}

        {dialogState === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Analizando tu foto...</p>
          </div>
        )}

        {dialogState === 'confirm' && (
          <div className="space-y-4">
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-4">
              {identifiedProducts.map((product, index) => {
                const uniqueId = `identified-product-${product}-${index}`;
                return (
                  <div key={uniqueId} className="flex items-center gap-3">
                    <Checkbox
                      id={uniqueId}
                      checked={selectedProducts.has(product)}
                      onCheckedChange={(checked) => handleProductSelection(product, !!checked)}
                    />
                    <Label htmlFor={uniqueId} className="cursor-pointer font-normal">{product}</Label>
                  </div>
                )
              })}
            </div>
             <div className="flex justify-between items-center">
                 <p className="text-sm text-muted-foreground">{selectedProducts.size} de {identifiedProducts.length} seleccionados</p>
                <Button variant="ghost" size="sm" onClick={resetState}>
                    <RefreshCw className="mr-2 h-4 w-4"/>
                    Probar de nuevo
                </Button>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {dialogState === 'confirm' && (
            <Button onClick={handleAddClick} disabled={selectedProducts.size === 0} className="w-full">
                <Check className="mr-2"/> Añadir {selectedProducts.size} productos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    