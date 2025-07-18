
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>("capture");
  const [identifiedProducts, setIdentifiedProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [cameraActive, setCameraActive] = useState(false);

  const resetState = () => {
    setDialogState("capture");
    setIdentifiedProducts([]);
    setSelectedProducts(new Set());
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);

  const handleIdentify = async (dataUri: string) => {
    setDialogState("processing");
    try {
      console.log('[IA] Enviando imagen a la IA para identificar productos...');
      const result = await identifyProductsFromPhoto({ photoDataUri: dataUri });
      console.log('[IA] Respuesta de la IA:', result);
      if (result.products.length > 0) {
        await (onAddProducts as any)(result.products);
        toast({ title: "Productos añadidos", description: `${result.products.length} producto(s) añadido(s) a tu despensa.` });
        onOpenChange(false);
      } else {
        console.warn('[IA] No se encontraron productos en la imagen.');
        toast({ title: "No se encontraron productos", description: "Prueba con otra foto más clara o con más productos.", variant: "destructive" });
        setDialogState("capture");
      }
    } catch (error) {
      console.error("[IA] Error en la identificación de productos", error);
      toast({ title: "Error en la identificación", description: "No se pudieron identificar los productos.", variant: "destructive" });
      setDialogState("capture");
    }
  };
  
  // Iniciar cámara y mostrar vista previa
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      toast({ title: "Error de cámara", description: "No se pudo acceder a la cámara.", variant: "destructive" });
      setCameraActive(false);
    }
  };

  // Capturar imagen de la vista previa
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      // Detener la cámara después de capturar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      handleIdentify(dataUrl);
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
              {!cameraActive && (
                <Button onClick={handleStartCamera} className="w-full">
                  <Camera className="mr-2" /> Activar cámara
                </Button>
              )}
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2" /> Subir Imagen
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            {cameraActive && (
              <div className="flex flex-col items-center gap-2">
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 320, borderRadius: 8, background: '#000' }} />
                <Button onClick={handleCapturePhoto} className="mt-2 w-full">
                  📸 Capturar
                </Button>
              </div>
            )}
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

    