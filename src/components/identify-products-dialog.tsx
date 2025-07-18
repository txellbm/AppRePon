
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReponToast } from "@/hooks/use-repon-toast";
import { identifyProductsFromPhoto } from "@/lib/actions";
import { Camera, Upload, Loader2 } from "lucide-react";

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
  const [cameraActive, setCameraActive] = useState(false);

  const resetState = () => {
    setDialogState("capture");
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
    // Limpiar cámara al cerrar diálogo
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

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
      // Apagar la cámara tras capturar
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
            {dialogState === 'capture' && "Usa tu cámara o sube una foto de tus productos."}
            {dialogState === 'processing' && "Identificando productos en la imagen..."}
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
      </DialogContent>
    </Dialog>
  );
}

    