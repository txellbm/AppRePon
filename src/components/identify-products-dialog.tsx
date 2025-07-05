
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReponToast } from "@/hooks/use-repon-toast";
import { identifyProductsFromPhotoAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, AlertTriangle, Upload, Check, Loader2, RefreshCw } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [dialogState, setDialogState] = useState<DialogState>("capture");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [identifiedProducts, setIdentifiedProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  const resetState = () => {
    setDialogState("capture");
    setIdentifiedProducts([]);
    setSelectedProducts(new Set());
    if (hasCameraPermission === null) {
        requestCameraPermission();
    }
  };

  const requestCameraPermission = async () => {
    if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
      setHasCameraPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
      });
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing rear camera", error);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera", err);
        setHasCameraPermission(false);
      }
    }
  };
  
  useEffect(() => {
    if (open) {
      resetState();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [open, stopCameraStream]);

  const handleIdentify = async (dataUri: string) => {
    setDialogState("processing");
    try {
      const result = await identifyProductsFromPhotoAction({ photoDataUri: dataUri });
      if (result.products.length > 0) {
        setIdentifiedProducts(result.products);
        setSelectedProducts(new Set(result.products)); 
        setDialogState("confirm");
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
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        handleIdentify(dataUri);
      }
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
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted border">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <p className="font-semibold">Cámara no disponible</p>
                  <p className="text-sm text-muted-foreground">Por favor, permite el acceso a la cámara en tu navegador para usar esta función.</p>
                </div>
              )}
               {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
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

    