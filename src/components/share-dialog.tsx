
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useReponToast } from "@/hooks/use-repon-toast";
import type { Product } from "@/lib/types";
import { Copy } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pantry: Product[];
  shoppingList: Product[];
}

type ShareableList = "pantry" | "shoppingList";

export function ShareDialog({ open, onOpenChange, pantry, shoppingList }: ShareDialogProps) {
  const { toast } = useReponToast();
  const [selectedLists, setSelectedLists] = useState<Set<ShareableList>>(
    new Set(["pantry", "shoppingList"])
  );

  const handleSelectionChange = (list: ShareableList, checked: boolean) => {
    setSelectedLists(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(list);
      } else {
        newSet.delete(list);
      }
      return newSet;
    });
  };

  const generateShareableText = () => {
    let text = "";
    if (selectedLists.has("pantry") && pantry.length > 0) {
      text += `*Mi Despensa:*\n${pantry.map(p => `- ${p.name} (${p.status})`).join('\n')}\n\n`;
    }
    if (selectedLists.has("shoppingList") && shoppingList.length > 0) {
      const toBuyNow = shoppingList.filter(p => !p.buyLater);
      const toBuyLater = shoppingList.filter(p => p.buyLater);
      
      if (toBuyNow.length > 0) {
        text += `*Lista de Compra:*\n${toBuyNow.map(p => `- ${p.name}`).join('\n')}\n\n`;
      }
      if (toBuyLater.length > 0) {
        text += `*Comprar otro día:*\n${toBuyLater.map(p => `- ${p.name}`).join('\n')}\n\n`;
      }
    }
    return text.trim();
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast({
        title: "Nada que copiar",
        description: "Selecciona al menos una lista con productos.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        toast({ title: "Contenido copiado al portapapeles", duration: 2500 });
        onOpenChange(false);
      },
      () => {
        toast({
          title: "Error al copiar el contenido",
          variant: "destructive",
        });
      }
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir lista</DialogTitle>
          <DialogDescription>
            Elige qué listas quieres incluir y cómo quieres compartirlas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="share-pantry" checked={selectedLists.has("pantry")} onCheckedChange={(checked) => handleSelectionChange("pantry", !!checked)} />
            <Label htmlFor="share-pantry" className="cursor-pointer">Despensa ({pantry.length})</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="share-shoppingList" checked={selectedLists.has("shoppingList")} onCheckedChange={(checked) => handleSelectionChange("shoppingList", !!checked)} />
            <Label htmlFor="share-shoppingList" className="cursor-pointer">Lista de Compra ({shoppingList.length})</Label>
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => copyToClipboard(generateShareableText())}>
            <Copy className="mr-2 h-4 w-4" /> Copiar al portapapeles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


    