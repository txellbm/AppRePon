"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { generateRecipe, generateGrammaticalMessage, correctProductName, improveCategorization, categorizeProduct } from "@/lib/actions";
import { type Product, type Category, type ProductStatus, type ViewMode, type GenerateRecipeOutput } from "@/lib/types";
import { useReponToast } from "@/hooks/use-repon-toast";
import { useSharedList } from "@/hooks/use-shared-list";
import { IdentifyProductsDialog } from "@/components/identify-products-dialog";
import { ShareDialog } from "@/components/share-dialog";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  List,
  LayoutGrid,
  Link,
  AlertTriangle,
  ShoppingCart,
  Tags,
  Search,
  Carrot,
  Egg,
  Beef,
  Wheat,
  Cookie,
  CupSoda,
  SprayCan,
  X,
  Pipette,
  Archive,
  Share2,
  ArrowDownAZ,
  ArrowUpAZ,
  Camera,
  Loader2,
  RefreshCw,
  ChefHat,
  HelpCircle,
  Filter,
  History,
  MoveUp,
  MoreVertical,
  Undo2,
  Package,
  Pencil,
  Cloudy,
  Copy,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const categories: Category[] = ["Frutas y Verduras", "Lácteos y Huevos", "Proteínas", "Panadería y Cereales", "Aperitivos", "Bebidas", "Hogar y Limpieza", "Condimentos y Especias", "Conservas y Despensa", "Otros"];

const categoryIcons: Record<Category, React.ReactNode> = {
  "Frutas y Verduras": <Carrot className="h-4 w-4" />,
  "Lácteos y Huevos": <Egg className="h-4 w-4" />,
  "Proteínas": <Beef className="h-4 w-4" />,
  "Panadería y Cereales": <Wheat className="h-4 w-4" />,
  "Aperitivos": <Cookie className="h-4 w-4" />,
  "Bebidas": <CupSoda className="h-4 w-4" />,
  "Hogar y Limpieza": <SprayCan className="h-4 w-4" />,
  "Condimentos y Especias": <Pipette className="h-4 w-4" />,
  "Conservas y Despensa": <Archive className="h-4 w-4" />,
  "Otros": <Package className="h-4 w-4" />,
};

type SortConfig = {
  by: 'name';
  order: 'asc' | 'desc';
}

// Función para normalizar cadenas (eliminar tildes y pasar a minúsculas)
const normalize = (str: string) => str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const normalizeName = (str: string) => str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Hook para detectar conexión online/offline
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return isOnline;
}

function AddItemForm({ onAddItem, history, pantry, shoppingList, activeTab, onDeleteHistoryItem }: {
onAddItem: (name: string) => void,
history: string[],
pantry: Product[],
shoppingList: Product[],
activeTab: string,
onDeleteHistoryItem: (name: string) => Promise<void> | void
}) {
  const [itemName, setItemName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useReponToast();

  useEffect(() => {
    setItemName("");
    setSuggestions([]);
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
    if (value && !value.includes(',')) {
      const listItems = activeTab === 'pantry' ? pantry : shoppingList;
      const currentItems = new Set(listItems.map(p => p.name.toLowerCase()));
      setSuggestions(
        history.filter(
          item => item.toLowerCase().includes(value.toLowerCase()) && !currentItems.has(item.toLowerCase())
        ).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    onAddItem(name);
    setItemName("");
    setSuggestions([]);
  }

  const handleDeleteSuggestion = async (name: string) => {
    // Eliminar de la lista visual inmediatamente
    setSuggestions(prev => prev.filter(s => s !== name));
    try {
      await onDeleteHistoryItem(name);
    } catch (error) {
      toast({
        title: "Error al eliminar sugerencia",
        description: `No se pudo eliminar "${name}" del historial. Intenta de nuevo.`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim()) {
      onAddItem(itemName.trim());
      setItemName("");
      setSuggestions([]);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative pt-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            type="text"
            value={itemName}
            onChange={handleInputChange}
            placeholder="Puedes añadir varios productos separados por comas"
            className="flex-grow bg-gray-800 text-white placeholder-gray-400"
          />
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 p-2 flex flex-col gap-1">
              {suggestions.map((suggestion, index) => (
                <div key={`suggestion-${suggestion}-${index}`} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left flex-grow p-2 rounded hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSuggestion(suggestion)}
                    className="p-2 text-destructive hover:bg-destructive/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </div>
        <Button type="submit" size="icon" aria-label="Añadir producto" className="hover:opacity-80">
          <Plus />
        </Button>
      </form>
    </div>
  );
}


function ProductCard({
  product,
  viewMode,
  onUpdateStatus,
  onDelete,
  onAddToShoppingList,
  onUpdateCategory,
  onEdit,
  onDirectStatusChange,
  onToggleFreeze,
  onLongPress,
  onCancelLongPress,
  onSetEditingFrozenDate
}: {
  product: Product;
  viewMode: ViewMode;
  onUpdateStatus: (id: string, status: ProductStatus) => void;
  onDelete: (id: string) => void;
  onAddToShoppingList: (id: string) => void;
  onUpdateCategory: (id: string, category: Category) => void;
  onEdit: (product: Product) => void;
  onDirectStatusChange: (id: string, status: ProductStatus) => void;
  onToggleFreeze: (id: string) => void;
  onLongPress: (id: string, event: React.MouseEvent | React.TouchEvent) => void;
  onCancelLongPress: () => void;
  onSetEditingFrozenDate: (data: {product: Product, date: string}) => void;
}) {
  const handleCycleStatus = () => {
    const statuses: ProductStatus[] = ["available", "low", "out of stock"];
    const currentIndex = statuses.indexOf(product.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateStatus(product.id, nextStatus);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      onLongPress(product.id, event);
    }, 1500);
    // Guardar el timer para poder cancelarlo
    (event.target as HTMLElement).setAttribute('data-timer', timer.toString());
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    const timerId = (event.target as HTMLElement).getAttribute('data-timer');
    if (timerId) {
      clearTimeout(parseInt(timerId));
      (event.target as HTMLElement).removeAttribute('data-timer');
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const timer = setTimeout(() => {
      onLongPress(product.id, event);
    }, 1500);
    (event.target as HTMLElement).setAttribute('data-timer', timer.toString());
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const timerId = (event.target as HTMLElement).getAttribute('data-timer');
    if (timerId) {
      clearTimeout(parseInt(timerId));
      (event.target as HTMLElement).removeAttribute('data-timer');
    }
  };

  const statusStyles = {
    available: "bg-verde-eucalipto text-white",
    low: "bg-amarillo-mostaza text-white",
    "out of stock": "bg-rojo-coral text-white",
  }[product.status];

  const isListView = viewMode === 'list';
  const isFrozen = !!product?.frozenAt;
  const frozenDate = product?.frozenAt ? new Date(product.frozenAt).toLocaleDateString('es-ES') : null;

  return (
    <motion.div
      id={`product-${product.id}`}
      layout
      layoutId={'pantry-' + product.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-md transition-all duration-300 hover:brightness-110 shadow-md mb-2",
        isListView
          ? "p-3 flex items-center justify-between"
          : "relative p-2 flex flex-col items-center justify-center text-center min-h-[6rem]",
        statusStyles,
        "cursor-pointer transition-colors transition-color"
      )}
      onClick={handleCycleStatus}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-2">
        <h3 className={cn("font-semibold", isListView ? '' : 'line-clamp-2')}>{product.name}</h3>
        {isFrozen && <span className="text-blue-300">❄️</span>}
      </div>
      
      {isFrozen && frozenDate && (
        <div className="text-xs opacity-80 mt-1">
          Congelado: {frozenDate}
        </div>
      )}

      {isListView ? (
        <div className="shrink-0 flex items-center gap-1">
        {product.status === 'low' && (
          product.isPendingPurchase ? (
            <div className="flex items-center justify-center text-xs h-8 px-2 rounded-md bg-[#5D6D7E] text-white border border-[#5D6D7E] font-medium">
                Pendiente de compra
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-gray-800 text-white hover:bg-gray-700"
                    aria-label="Añadir a la lista de compra"
                    onClick={(e) => { e.stopPropagation(); onAddToShoppingList(product.id); }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Añadir a la compra</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Editar Nombre</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Tags className="mr-2 h-4 w-4" />
                        <span>Cambiar Categoría</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={product.category} onValueChange={(newCategory) => onUpdateCategory(product.id, newCategory as Category)}>
                                {categories.map((cat) => (
                                    <DropdownMenuRadioItem key={cat} value={cat}>{cat}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Cambiar Estado</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {product.status === 'available' && (
                                <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'low'); }}>
                                        <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                                        <span>Cambiar a "Queda poco"</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(product.id, 'out of stock'); }}>
                                        <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                                        <span>Cambiar a "Agotado (mover a compra)"</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {product.status === 'low' && (
                                <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'available'); }}>
                                        <div className="w-3 h-3 rounded-full bg-verde-eucalipto mr-2" />
                                        <span>Cambiar a "Disponible"</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(product.id, 'out of stock'); }}>
                                        <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                                        <span>Cambiar a "Agotado (mover a compra)"</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {product.status === 'out of stock' && (
                                <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'available'); }}>
                                        <div className="w-3 h-3 rounded-full bg-verde-eucalipto mr-2" />
                                        <span>Cambiar a "Disponible"</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'low'); }}>
                                        <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                                        <span>Cambiar a "Queda poco"</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                {isFrozen && product?.frozenAt && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { 
                      e.stopPropagation(); 
                      if (product.frozenAt) {
                        onSetEditingFrozenDate({ product, date: new Date(product.frozenAt).toISOString().split('T')[0] }); 
                      }
                    }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Editar fecha de congelación</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[#FF4C4C] hover:bg-[#2C0000] hover:text-white focus:bg-[#2C0000] focus:text-white" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      ) : (
        <div className="absolute top-1 right-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Editar Nombre</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="mr-2 h-4 w-4" />
                  <span>Cambiar Categoría</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={product.category} onValueChange={(newCategory) => onUpdateCategory(product.id, newCategory as Category)}>
                      {categories.map((cat) => (
                        <DropdownMenuRadioItem key={cat} value={cat}>{cat}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Cambiar Estado</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {product.status === 'available' && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'low'); }}>
                          <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                          <span>Cambiar a "Queda poco"</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(product.id, 'out of stock'); }}>
                          <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                          <span>Cambiar a "Agotado (mover a compra)"</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {product.status === 'low' && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'available'); }}>
                          <div className="w-3 h-3 rounded-full bg-verde-eucalipto mr-2" />
                          <span>Cambiar a "Disponible"</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(product.id, 'out of stock'); }}>
                          <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                          <span>Cambiar a "Agotado (mover a compra)"</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {product.status === 'out of stock' && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'available'); }}>
                          <div className="w-3 h-3 rounded-full bg-verde-eucalipto mr-2" />
                          <span>Cambiar a "Disponible"</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDirectStatusChange(product.id, 'low'); }}>
                          <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                          <span>Cambiar a "Queda poco"</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              {isFrozen && product?.frozenAt && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { 
                    e.stopPropagation(); 
                    if (product.frozenAt) {
                      onSetEditingFrozenDate({ product, date: new Date(product.frozenAt).toISOString().split('T')[0] }); 
                    }
                  }}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Editar fecha de congelación</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[#FF4C4C] hover:bg-[#2C0000] hover:text-white focus:bg-[#2C0000] focus:text-white" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  );
}

function ShoppingItemCard({
  item,
  viewMode,
  onCardClick,
  onToggleBuyLater,
  onDelete,
  onReturnToPantry,
  onEdit,
  onMarkAsOutOfStock,
  onDirectStatusChange,
  layoutId,
  isChecking = false,
  isSliding = false
}: {
  item: Product;
  viewMode: ViewMode;
  onCardClick: (id: string) => void;
  onToggleBuyLater: (id: string) => void;
  onDelete: (id: string) => void;
  onReturnToPantry: (id: string) => void;
  onEdit: (product: Product) => void;
  onMarkAsOutOfStock: (id: string) => void;
  onDirectStatusChange: (id: string, status: ProductStatus) => void;
  layoutId: string;
  isChecking?: boolean;
  isSliding?: boolean;
}) {
  const statusStyles = {
    available: "bg-verde-eucalipto text-white",
    low: "bg-amarillo-mostaza text-white",
    "out of stock": "bg-rojo-coral text-white",
  }[item.status];
      
  const isListView = viewMode === "list";

  return (
    <motion.div
      id={`product-${item.id}`}
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: isSliding ? -100 : -50, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-md transition-all duration-300 hover:brightness-110 shadow-md mb-2",
        isListView
          ? "p-3 flex items-center justify-between"
          : "p-2 flex flex-col items-center justify-center text-center min-h-[6rem]",
        statusStyles,
        "transition-colors transition-color",
        isChecking && "bg-verde-eucalipto opacity-80"
      )}
      onClick={() => onCardClick(item.id)}
    >
      <h3 className={cn("font-semibold", isListView ? '' : 'line-clamp-2')}>{item.name}</h3>

      {isListView ? (
      <div className="shrink-0 flex items-center gap-1">
        <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); onToggleBuyLater(item.id); }}
                     >
                        {item.buyLater ? <MoveUp className="h-4 w-4" /> : <History className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{item.buyLater ? 'Mover a la compra de hoy' : 'Dejar para otro día'}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Editar Nombre</span>
                </DropdownMenuItem>
                {item.status === 'low' && (
                    <DropdownMenuItem onClick={() => onReturnToPantry(item.id)}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        <span>Devolver a despensa</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {item.status === 'out of stock' ? (
                    <DropdownMenuItem onClick={() => onDirectStatusChange(item.id, 'low')}>
                        <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                        <span>Marcar como "Queda poco"</span>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => onMarkAsOutOfStock(item.id)}>
                        <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                        <span>Marcar como "Agotado"</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[#FF4C4C] hover:bg-[#2C0000] hover:text-white focus:bg-[#2C0000] focus:text-white" onClick={() => onDelete(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      ) : (
        <div className="absolute top-1 right-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Editar Nombre</span>
              </DropdownMenuItem>
              {item.status === 'low' && (
                <DropdownMenuItem onClick={() => onReturnToPantry(item.id)}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  <span>Devolver a despensa</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {item.status === 'out of stock' ? (
                  <DropdownMenuItem onClick={() => onDirectStatusChange(item.id, 'low')}>
                      <div className="w-3 h-3 rounded-full bg-amarillo-mostaza mr-2" />
                      <span>Marcar como "Queda poco"</span>
                  </DropdownMenuItem>
              ) : (
                  <DropdownMenuItem onClick={() => onMarkAsOutOfStock(item.id)}>
                      <div className="w-3 h-3 rounded-full bg-rojo-coral mr-2" />
                      <span>Marcar como "Agotado"</span>
                  </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[#FF4C4C] hover:bg-[#2C0000] hover:text-white focus:bg-[#2C0000] focus:text-white" onClick={() => onDelete(item.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  );
}

export default function PantryPage({ listId }: { listId: string }) {
  console.log('💡 Render iniciado');
  var a,s;
  const [activeTab, setActiveTab] = useState<"pantry" | "shopping-list">("pantry");
  const { toast } = useReponToast();
  const { pantry, shoppingList, history, categoryOverrides, isLoaded, hasPendingWrites, handleAddItem, handleBulkAdd, updateRemoteList, handleShoppingListAddItem } = useSharedList(listId, toast);
  
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ by: 'name', order: 'asc' });
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus | 'frozen'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showIdentifyDialog, setShowIdentifyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLegendDialog, setShowLegendDialog] = useState(false);
  const [checkingItemId, setCheckingItemId] = useState<string | null>(null);
  const [slidingRightId, setSlidingRightId] = useState<string | null>(null);
  
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [recipe, setRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  
  // Estados para funcionalidad de congelar/descongelar
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showFreezeMenu, setShowFreezeMenu] = useState<{id: string, x: number, y: number} | null>(null);
  const [editingFrozenDate, setEditingFrozenDate] = useState<{product: Product, date: string} | null>(null);

  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [openShoppingSections, setOpenShoppingSections] = useState<string[]>(['buy-later-section']);
  const prevPantryRef = useRef<Product[]>([]);
  const prevShoppingRef = useRef<Product[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState("");

  const isOnline = useOnlineStatus();
  console.log('isOnline', isOnline);

  useEffect(() => {
    if (editingProduct) {
        setNewProductName(editingProduct.name);
    }
  }, [editingProduct]);

  const handleUpdateName = async () => {
    if (!editingProduct || !newProductName.trim()) {
        setEditingProduct(null);
        return;
    }

    const finalNewName = newProductName.trim();
    if (finalNewName.toLowerCase() === editingProduct.name.toLowerCase()) {
        setEditingProduct(null);
        return;
    }

    const toastie = toast({ title: "Actualizando nombre...", duration: 5000 });

    try {
        const { correctedName } = await correctProductName({ productName: finalNewName });
        
        const oldName = editingProduct.name;
        
        const existsInPantry = pantry.some(p => p.id === editingProduct.id);
        const existsInShopping = shoppingList.some(p => p.id === editingProduct.id);

        const nameExistsInPantry = existsInPantry &&
            pantry.some(p => p.name.toLowerCase() === correctedName.toLowerCase() && p.id !== editingProduct.id);
        const nameExistsInShopping = existsInShopping &&
            shoppingList.some(p => p.name.toLowerCase() === correctedName.toLowerCase() && p.id !== editingProduct.id);

        const nameExists = nameExistsInPantry || nameExistsInShopping;
        
        if (nameExists) {
        toastie.update({                title: "Error: Producto duplicado",
                description: `Ya existe un producto llamado "${correctedName}".`,
                variant: "destructive"
            });
            return;
        }

        const newPantry = pantry.map(p => 
            p.id === editingProduct.id ? { ...p, name: correctedName } : p
        );
        const newShoppingList = shoppingList.map(p => 
            p.id === editingProduct.id ? { ...p, name: correctedName } : p
        );

        const newHistory = [...new Set([...history.filter(h => h.toLowerCase() !== oldName.toLowerCase()), correctedName])];
        
        let newOverrides = { ...categoryOverrides };
        const oldKey = oldName.toLowerCase();
        if (newOverrides[oldKey]) {
            newOverrides[correctedName.toLowerCase()] = newOverrides[oldKey];
            delete newOverrides[oldKey];
        }
        updateRemoteList({
            pantry: newPantry,
            shoppingList: newShoppingList,
            history: newHistory,
            categoryOverrides: newOverrides,
        });

        toastie.update({
            title: "¡Nombre actualizado!",
            description: `"${oldName}" ahora es "${correctedName}".`
        });

    } catch (error) {
        console.error("Error updating product name:", error);
        toastie.update({
            title: "Error",
            description: "No se pudo actualizar el nombre del producto.",
            variant: "destructive"
        });
    } finally {
        setEditingProduct(null);
    }
  };


  const filterOptions: Record<"pantry" | "shopping-list", {value: ProductStatus | 'all' | 'frozen', label: string}[]> = {
    pantry: [
        { value: 'all', label: 'Todos' },
        { value: 'available', label: 'Disponibles' },
        { value: 'low', label: 'Queda poco' },
        { value: 'frozen', label: 'Congelados' },
    ],
    'shopping-list': [
        { value: 'all', label: 'Todos' },
        { value: 'out of stock', label: 'Agotados' },
        { value: 'low', label: 'Poco stock' },
    ],
  };
  

  useEffect(() => {
    const validFiltersForTab = filterOptions[activeTab]?.map(f => f.value) || [];
    if (!validFiltersForTab.includes(statusFilter)) {
      setStatusFilter('all');
    }
  }, [activeTab, statusFilter, filterOptions]);


  useEffect(() => {
    if (listId) {
      try {
        localStorage.setItem('repon-lastListId', listId);
      } catch (error) {
        console.warn("Could not access localStorage to save list ID.");
      }
    }
  }, [listId]);

  useEffect(() => {
    if (activeTab === 'pantry') {
      setViewMode('list');
      setGroupByCategory(true);
    } else {
      setViewMode('list');
      setGroupByCategory(false);
    }
  }, [activeTab]);


  useEffect(() => {
    console.log('🟢 useEffect: pantry o groupByCategory cambian', pantry, groupByCategory);
    if (groupByCategory) {
        const prevPantrySet = new Set(prevPantryRef.current.map(p => p.id));
        const newProducts = pantry.filter(p => !prevPantrySet.has(p.id));

        if (newProducts.length > 0) {
            const newCategories = new Set(newProducts.map(p => p.category));
            setOpenCategories(prev => [...new Set([...prev, ...Array.from(newCategories)])] as string[]);
        } else if (openCategories.length === 0) {
            const allCategories = [...new Set(pantry.map(p => p.category))];
            setOpenCategories(allCategories.filter((c): c is Category => c !== undefined));
        }
    }
  }, [pantry, groupByCategory, openCategories.length]);

  useEffect(() => {
    console.log('🟢 useEffect: pantry cambia', pantry);
    const prevIds = new Set(prevPantryRef.current.map(p => p.id));
    const newItems = pantry.filter(p => !prevIds.has(p.id));
    if (newItems.length > 0) {
      const lastId = newItems[newItems.length - 1].id;
      setTimeout(() => {
        const el = document.getElementById(`product-${lastId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    prevPantryRef.current = pantry;
  }, [pantry]);

  useEffect(() => {
    console.log('🟢 useEffect: shoppingList cambia', shoppingList);
    const prevIds = new Set(prevShoppingRef.current.map(p => p.id));
    const newItems = shoppingList.filter(p => !prevIds.has(p.id));
    if (newItems.length > 0) {
      const lastId = newItems[newItems.length - 1].id;
      setTimeout(() => {
        const el = document.getElementById(`product-${lastId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    prevShoppingRef.current = shoppingList;
  }, [shoppingList]);
  
  useEffect(() => {
    console.log('🟢 useEffect: groupByCategory, pantry, shoppingList cambian', groupByCategory, pantry, shoppingList);
    if (groupByCategory) {
      const allCategories = [...new Set([...pantry.map(p => p.category), ...shoppingList.map(p => p.category)])];
      setOpenCategories(allCategories.filter((c): c is Category => c !== undefined));
    }
  }, [groupByCategory, pantry, shoppingList]);

  useEffect(() => {
    console.log('🟢 useEffect: activeTab, groupByCategory, shoppingList cambian', activeTab, groupByCategory, shoppingList);
    if (activeTab === 'shopping-list' && groupByCategory) {
      const categoriesSet = new Set<string>(['buy-later-section']);
      shoppingList.forEach(p => categoriesSet.add(p.category || 'Otros'));
      setOpenShoppingSections(Array.from(categoriesSet));
    }
  }, [activeTab, groupByCategory, shoppingList]);

  useEffect(() => {
    const isValidArray = (arr: unknown): arr is Product[] => Array.isArray(arr);
    console.log('🟢 useEffect: limpieza optimista', pantry, shoppingList);
    if (
      isValidArray(pantry) &&
      isValidArray(shoppingList) &&
      pantry.length === shoppingList.length &&
      JSON.stringify(pantry) === JSON.stringify(shoppingList)
    ) {
    
    }

    if (
      isValidArray(pantry) &&
      isValidArray(shoppingList) &&
      pantry.length === shoppingList.length &&
      JSON.stringify(pantry) === JSON.stringify(shoppingList)
    ) {
      
    }
  }, [pantry, shoppingList]);

  const handleUpdateCategory = async (id: string, newCategory: Category) => {
    const productInPantry = pantry.find((p) => p.id === id);
    const productInShopping = shoppingList.find((p) => p.id === id);

    let newPantry = pantry;
    let newShoppingList = shoppingList;
    let productName = "";

    if (productInPantry) {
        productName = productInPantry.name;
        newPantry = pantry.map((p) => (p.id === id ? { ...p, category: newCategory } : p));
    }
    if (productInShopping) {
        productName = productInShopping.name;
        newShoppingList = shoppingList.map((p) => (p.id === id ? { ...p, category: newCategory } : p));
    }

    if (productName) {
        const key = productName.toLowerCase();
        const newOverrides = { ...categoryOverrides, [key]: newCategory };
        updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList, categoryOverrides: newOverrides });
        try {
            await improveCategorization({ productName, userSelectedCategory: newCategory });
        } catch (e) {
            console.warn('Failed to improve categorization', e);
        }
        toast({ title: '¡Categoría cambiada!', description: `"${productName}" ahora está en "${newCategory}".` });
    }
  };

  const handleDeleteHistoryItem = (name: string) => {
    const newHistory = history.filter(
      (h) => h.toLowerCase() !== name.toLowerCase(),
    );
    updateRemoteList({ history: newHistory });
  };

  const handleDelete = (id: string) => {
    const itemInShoppingList = shoppingList.find((p) => p.id === id);

    let newPantry = pantry.filter((p) => p.id !== id);
    let newShoppingList = shoppingList.filter((p) => p.id !== id);

    if (itemInShoppingList && itemInShoppingList.reason === "low") {
      newPantry = newPantry.map((p) =>
        p.name.toLowerCase() === itemInShoppingList.name.toLowerCase()
          ? { ...p, isPendingPurchase: false }
          : p,
      );
    }

    updateRemoteList({
      pantry: newPantry,
      shoppingList: newShoppingList,
    });

    toast({ title: "¡Adiós, producto!" });
    setConfirmDeleteId(null);
  };
  
  const handleCheckShoppingItem = async (id: string, silent = false) => {
    const boughtItem = shoppingList.find(p => p.id === id);
    if (!boughtItem) return;

    let newPantry = [...pantry];
    const pantryItemIndex = pantry.findIndex(p => p.id === boughtItem.id);

    if (pantryItemIndex > -1) {
        newPantry[pantryItemIndex] = {
            ...pantry[pantryItemIndex],
            status: 'available',
            isPendingPurchase: false,
        };
    } else {
        const { reason, buyLater, ...restOfItem } = boughtItem;
        newPantry.push({
            ...restOfItem,
            status: 'available' as const,
            isPendingPurchase: false,
            buyLater: false,
        });
    }

    const newShoppingList = shoppingList.filter(p => p.id !== id);

    updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
    if (!silent) {
      const { message } = await generateGrammaticalMessage({ productName: boughtItem.name, messageType: 'added_to_pantry' });
      toast({ title: '¡A la saca!', description: message, audioText: message });
    }
  };

  const handleCardClick = (id: string) => {
    setCheckingItemId(id);
    setTimeout(() => {
      setSlidingRightId(id);
      setTimeout(() => {
        handleCheckShoppingItem(id, true);
        setCheckingItemId(null);
        setSlidingRightId(null);
      }, 500);
    }, 1500);
  };
  
  const handleLowStockToShoppingList = async (id: string) => {
    const product = pantry.find(p => p.id === id);
    if (!product || product.status !== 'low') return;

    const itemInShoppingList = shoppingList.find(item => item.id === product.id);

    let newShoppingList = [...shoppingList];

    if (itemInShoppingList) {
        newShoppingList = shoppingList.map(item =>
            item.id === itemInShoppingList.id ? { ...item, buyLater: false, status: 'low', reason: 'low' } : item
        );
    } else {
        const { isPendingPurchase, ...restOfProduct } = product;
        newShoppingList.push({
            ...restOfProduct,
            status: 'low',
            reason: 'low',
            isPendingPurchase: false,
            buyLater: false,
        });
    }

    const newPantry = pantry.map(p => p.id === id ? { ...p, isPendingPurchase: true } : p);
    updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });

    const { message } = await generateGrammaticalMessage({ productName: product.name, messageType: 'added_to_shopping_list' });
    toast({ title: '¡Anotado!', description: message, audioText: message });
  };

  const handleToggleBuyLater = (id: string) => {
    const item = shoppingList.find(p => p.id === id);
    if (!item) return;

    const newShoppingList = shoppingList.map(p => 
      p.id === id ? { ...p, buyLater: !p.buyLater } : p
    );
    updateRemoteList({ shoppingList: newShoppingList });
    
    // transition without notifications
  };

  const handleReturnToPantry = (id: string) => {
    const itemInShoppingList = shoppingList.find(p => p.id === id);
    if (!itemInShoppingList || itemInShoppingList.status !== 'low') {
        return;
    }
    setSlidingRightId(id);
    setTimeout(() => {
        const newPantry = pantry.map(p => {
            if (p.id === itemInShoppingList.id) {
                return { ...p, isPendingPurchase: false };
            }
            return p;
        });

        const newShoppingList = shoppingList.filter(p => p.id !== id);

        updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
        setSlidingRightId(null);
    }, 500);
  };


  const handleGenerateRecipe = async () => {
    const availableProducts = pantry
      .filter(p => p.status === 'available' || p.status === 'low')
      .map(p => p.name);

    if (availableProducts.length === 0) {
      toast({
        title: "No hay ingredientes",
        description: "Añade productos a tu despensa para poder generar una receta.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingRecipe(true);
    setRecipe(null);
    setIsRecipeDialogOpen(true);

    try {
      const result = await generateRecipe({
        products: availableProducts
      });
      setRecipe(result);
    } catch (error) {
      console.error("Error generating recipe", error);
      toast({
        title: "Error al crear la receta",
        description: "No se pudo generar una receta en este momento. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsRecipeDialogOpen(false);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };
  

  const handleNameSortToggle = () => {
    setSortConfig(current => {
      if (current.by === 'name') {
        return { by: 'name', order: current.order === 'asc' ? 'desc' : 'asc' };
      }
      return { by: 'name', order: 'asc' };
    });
  };

  const sortedAndFiltered = (items: Product[]) => {
     const { by, order } = sortConfig;
     const sorted = [...items];
     
     sorted.sort((a, b) => {
        let comparison = a.name.localeCompare(b.name);
        return order === 'asc' ? comparison : -comparison;
     });

     return sorted
        .filter(p => {
          if (statusFilter === 'frozen') {
            return !!p?.frozenAt;
          }
          return statusFilter === 'all' || p.status === statusFilter;
        })
        .filter(p => !searchQuery || normalize(p.name).includes(normalize(searchQuery)));
  }

  // Arrays seguros para evitar crash por undefined
  const safeArray = <T,>(arr: T[] | undefined | null): T[] => Array.isArray(arr) ? arr : [];

  const filteredPantry = useMemo(() => safeArray(sortedAndFiltered(safeArray(pantry))), [pantry, sortConfig, statusFilter, searchQuery]);
  const filteredShoppingList = useMemo(() => safeArray(sortedAndFiltered(safeArray(shoppingList))), [shoppingList, sortConfig, statusFilter, searchQuery]);
  const shoppingListNow = useMemo(() => safeArray(filteredShoppingList).filter(p => !p.buyLater), [filteredShoppingList]);
  const shoppingListLater = useMemo(() => safeArray(filteredShoppingList).filter(p => p.buyLater), [filteredShoppingList]);
  const groupedPantry = useMemo(() => {
    if (!groupByCategory) return {} as Record<string, Product[]>;
    return safeArray(filteredPantry).reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredPantry, groupByCategory]);
  const sortedPantryCategories = useMemo(() => Object.keys(groupedPantry).sort(), [groupedPantry]);
  const groupedShoppingListNow = useMemo(() => {
    if (!groupByCategory) return {} as Record<string, Product[]>;
    return safeArray(shoppingListNow).reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [shoppingListNow, groupByCategory]);
  const sortedShoppingListNowCategories = useMemo(() => Object.keys(groupedShoppingListNow).sort(), [groupedShoppingListNow]);
  const groupedShoppingListLater = useMemo(() => {
    if (!groupByCategory) return {} as Record<string, Product[]>;
    return safeArray(shoppingListLater).reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [shoppingListLater, groupByCategory]);
  const sortedShoppingListLaterCategories = useMemo(() => Object.keys(groupedShoppingListLater).sort(), [groupedShoppingListLater]);

  const getInstallMessage = () => {
    const appBaseUrl = window.location.origin;
    return `📲 **Instrucciones para instalar la app RePon:**\n\n⚠️ Si ya tienes otra versión instalada, elimínala antes de continuar.\n\n1. Abre este enlace en tu navegador del móvil:  \n👉 ${appBaseUrl}\n\n2. Pulsa en "Compartir" o los tres puntos del navegador.\n\n3. Toca "Añadir a pantalla de inicio".\n\n¡Y listo! Ya tendrás la app instalada como si fuera una app nativa.`;
  };

  const handleShareLink = () => {
    const message = getInstallMessage();
    navigator.clipboard.writeText(message).then(
      () => {
        toast({ title: "Instrucciones copiadas al portapapeles", duration: 2500 });
      },
      () => {
        toast({
          title: "No se pudo copiar el mensaje",
          description:
            "Esta función podría no estar disponible en tu navegador. Intenta copiar la URL manualmente.",
          duration: 5000,
          variant: "destructive",
        });
      }
    );
  };

  const currentAddItemHandler = activeTab === 'pantry' ? handleAddItem : handleShoppingListAddItem;
  const currentFilterOptions = filterOptions[activeTab] || filterOptions.pantry;

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "Modo offline",
        description: "Estás sin conexión. Los cambios se sincronizarán cuando vuelvas a estar online.",
        variant: "default",
        duration: 4000
      });
    }
  }, [isOnline]);

  if (!isLoaded) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center">
                <Image src="/logorepon.png" alt="Logo de RePon" width={180} height={45} priority />
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Cargando tu despensa...</p>
            </div>
        </div>
    );
  }
  
  const ViewAndSortOptions = () => (
    <>
      <DropdownMenuLabel>Opciones de Vista</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleNameSortToggle}>
          {sortConfig.order === 'desc' ? <ArrowUpAZ className="mr-2" /> : <ArrowDownAZ className="mr-2" />}
          <span>Ordenar por Nombre</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}>
          {viewMode === 'list' ? <LayoutGrid className="mr-2" /> : <List className="mr-2" />}
          <span>{viewMode === 'list' ? 'Vista de Cuadrícula' : 'Vista de Lista'}</span>
      </DropdownMenuItem>
    </>
  );

  const FilterOptions = () => (
     <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentFilterOptions.map(opt => (
            <DropdownMenuRadioItem key={`filter-opt-${opt.value}`} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
        ))}
     </DropdownMenuRadioGroup>
  );

  // Logs al inicio del render
  console.log("pantry", pantry);
  console.log("shoppingList", shoppingList);
  console.log("filteredPantry", filteredPantry);
  console.log("filteredShoppingList", filteredShoppingList);
  console.log("shoppingListNow", shoppingListNow);
  console.log("shoppingListLater", shoppingListLater);
  console.log("groupedPantry", groupedPantry);

  // Handler limpio para actualizar el estado de un producto
  const handleUpdateStatus = (id: string, status: ProductStatus) => {
    const product = pantry.find(p => p.id === id);
    if (!product) return;
    
    let newPantry = pantry.map(p => (p.id === id ? { ...p, status, isPendingPurchase: status === 'available' ? false : p.isPendingPurchase } : p));
    let newShoppingList = [...shoppingList];
    
    if (status === 'out of stock') {
      // Mover a la lista de la compra
      newPantry = pantry.filter(p => p.id !== id);
      const existingShoppingItem = shoppingList.find(item => item.id === product.id);
      if (existingShoppingItem) {
        newShoppingList = shoppingList.map(item => item.id === product.id ? { ...item, status: 'out of stock', reason: 'out of stock' } : item);
      } else {
        const { isPendingPurchase, ...restOfProduct } = product;
        newShoppingList.push({
          ...restOfProduct,
          status: 'out of stock',
          reason: 'out of stock',
          isPendingPurchase: false,
          buyLater: false,
        });
      }
    }
    
    if (status === 'available') {
      const shoppingListItem = shoppingList.find(item => item.id === product.id);
      if (shoppingListItem && shoppingListItem.reason === 'low') {
        newShoppingList = shoppingList.filter(item => item.id !== product.id);
      }
    }
    
    updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
  };

  // Handler para cambiar estado directamente sin ciclo
  const handleDirectStatusChange = (id: string, newStatus: ProductStatus) => {
    handleUpdateStatus(id, newStatus);
  };

  // Handler para marcar como agotado en la lista de compra sin pasar a despensa
  const handleMarkAsOutOfStock = (id: string) => {
    const item = shoppingList.find(p => p.id === id);
    if (!item) return;
    
    const newShoppingList = shoppingList.map(p => 
      p.id === id ? { ...p, status: 'out of stock' as ProductStatus } : p
    );
    
    updateRemoteList({ shoppingList: newShoppingList });
  };

  // Handler para congelar/descongelar producto
  const handleToggleFreeze = (id: string) => {
    const product = pantry.find(p => p.id === id);
    if (!product) return;

    const newPantry = pantry.map(p => 
      p.id === id 
        ? { 
            ...p, 
            frozenAt: p?.frozenAt ? undefined : Date.now() 
          } 
        : p
    );

    updateRemoteList({ pantry: newPantry });
    setShowFreezeMenu(null);
  };

  // Handler para editar fecha de congelación
  const handleUpdateFrozenDate = () => {
    if (!editingFrozenDate) return;

    const { product, date } = editingFrozenDate;
    const newDate = new Date(date).getTime();

    const newPantry = pantry.map(p => 
      p.id === product.id 
        ? { ...p, frozenAt: newDate } 
        : p
    );

    updateRemoteList({ pantry: newPantry });
    setEditingFrozenDate(null);
  };

  // Handler para long press en ProductCard
  const handleLongPress = (id: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setShowFreezeMenu({ id, x: rect.left + rect.width / 2, y: rect.top });
  };

  // Handler para cancelar long press
  const handleCancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Cerrar menú flotante al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFreezeMenu) {
        setShowFreezeMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFreezeMenu]);

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <span className="font-headline text-3xl font-bold text-primary">RePon</span>
              </div>
                <div className="flex items-center gap-1">
                    {hasPendingWrites && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Cloudy className="h-5 w-5 animate-spin text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Guardando cambios...</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={pantry.filter(p => p.status === 'available' || p.status === 'low').length === 0} onClick={handleGenerateRecipe}>
                            <ChefHat className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Generar Receta</p>
                        </TooltipContent>
                      </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setShowLegendDialog(true)}>
                                    <HelpCircle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ayuda</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleShareLink}>
                                    <Link className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Compartir enlace de la lista</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setShowShareDialog(true)}>
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Compartir/Copiar contenido</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                </div>
            </div>
        </header>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="pantry" data-testid="pantry-tab">Mi Despensa</TabsTrigger>
                        <TabsTrigger value="shopping-list" data-testid="shopping-list-tab">Lista de compra ({shoppingList.length})</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex sm:hidden w-full items-center justify-between">
                        <div className="flex items-center">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" className="h-9 w-9" onClick={() => setShowIdentifyDialog(true)} aria-label="Añadir producto con foto">
                                            <Camera className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Añadir producto con foto</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(!showSearch)} aria-label="Buscar productos">
                                <Search className="h-5 w-5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9">
                                      <Filter className="h-5 w-5" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <FilterOptions />
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant={sortConfig.by === 'name' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={handleNameSortToggle} aria-label="Ordenar por nombre">
                                            {sortConfig.order === 'desc' ? <ArrowUpAZ className="h-5 w-5" /> : <ArrowDownAZ className="h-5 w-5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ordenar por Nombre ({sortConfig.order === 'asc' ? 'A-Z' : 'Z-A'})</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')} aria-label="Cambiar vista">
                                            {viewMode === 'list' ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{viewMode === 'list' ? 'Vista de Cuadrícula' : 'Vista de Lista'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                          variant={groupByCategory ? 'secondary' : 'ghost'}
                                          size="icon"
                                          className="h-9 w-9"
                                          onClick={() => setGroupByCategory((v) => !v)}
                                          aria-label="Agrupar por categorías"
                                        >
                                          <Tags className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Agrupar por Categorías</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(!showSearch)} aria-label="Buscar productos">
                          <Search className="h-5 w-5" />
                      </Button>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                  <Filter className="h-5 w-5" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <FilterOptions />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={sortConfig.by === 'name' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={handleNameSortToggle} aria-label="Ordenar por nombre">
                                    {sortConfig.order === 'desc' ? <ArrowUpAZ className="h-5 w-5" /> : <ArrowDownAZ className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ordenar por Nombre ({sortConfig.order === 'asc' ? 'A-Z' : 'Z-A'})</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')} aria-label="Cambiar vista">
                                    {viewMode === 'list' ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{viewMode === 'list' ? 'Vista de Cuadrícula' : 'Vista de Lista'}</p>
                            </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={groupByCategory ? 'secondary' : 'ghost'}
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => setGroupByCategory((v) => !v)}
                              aria-label="Agrupar por categorías"
                            >
                              <Tags className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Agrupar por Categorías</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Separator orientation="vertical" className="h-6 mx-1" />

                      <TooltipProvider>
                         <Tooltip>
                          <TooltipTrigger asChild>
                              <Button size="icon" className="h-9 w-9" onClick={() => setShowIdentifyDialog(true)} aria-label="Añadir producto con foto">
                                  <Camera className="h-5 w-5" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Añadir producto con foto</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                </div>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="relative mt-4"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar productos..."
                        className="pl-10 w-full bg-gray-800 text-white placeholder-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              <AddItemForm
                onAddItem={currentAddItemHandler}
                history={history}
                pantry={pantry}
                shoppingList={shoppingList}
                activeTab={activeTab}
                onDeleteHistoryItem={handleDeleteHistoryItem}
              />
            </div>
            
            <TabsContent value="pantry">
              <div className="mt-6">
                {pantry.length > 0 ? (
                  filteredPantry.length > 0 ? (
                    !groupByCategory ? (
                      <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                        <AnimatePresence>
                          {filteredPantry.map(product => (
                            <ProductCard
                              key={`pantry-${product.id}`}
                              product={product}
                              viewMode={viewMode}
                              onUpdateStatus={handleDirectStatusChange}
                              onDelete={handleDelete}
                              onAddToShoppingList={handleLowStockToShoppingList}
                              onUpdateCategory={handleUpdateCategory}
                              onEdit={setEditingProduct}
                              onDirectStatusChange={handleDirectStatusChange}
                              onToggleFreeze={handleToggleFreeze}
                              onLongPress={handleLongPress}
                              onCancelLongPress={handleCancelLongPress}
                              onSetEditingFrozenDate={setEditingFrozenDate}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories} className="w-full space-y-2">
                         <AnimatePresence>
                          {sortedPantryCategories.map(category => (
                            groupedPantry?.[category] && (
                              <AccordionItem key={`pantry-cat-${category}`} value={category} className="border-none">
                                <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline rounded-md p-2">
                                    <div className="flex items-center gap-2">{categoryIcons[category as Category]} {category}</div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                                    <AnimatePresence>
                                        {(groupedPantry?.[category] || []).map((product) => (
                                        <ProductCard
                                          key={`pantry-grouped-${product.id}`}
                                          product={product}
                                          viewMode={viewMode}
                                          onUpdateStatus={handleDirectStatusChange}
                                          onDelete={handleDelete}
                                          onAddToShoppingList={handleLowStockToShoppingList}
                                          onUpdateCategory={handleUpdateCategory}
                                          onEdit={setEditingProduct}
                                          onDirectStatusChange={handleDirectStatusChange}
                                          onToggleFreeze={handleToggleFreeze}
                                          onLongPress={handleLongPress}
                                          onCancelLongPress={handleCancelLongPress}
                                          onSetEditingFrozenDate={setEditingFrozenDate}
                                        />
                                        ))}
                                    </AnimatePresence>
                                    </div>
                                </AccordionContent>
                                <Separator className="mt-2" />
                              </AccordionItem>
                            )
                          ))}
                        </AnimatePresence>
                      </Accordion>
                    )
                  ) : (
                    <div className="text-center py-10 bg-card rounded-lg">
                      <p className="text-muted-foreground">No se encontraron productos con los filtros actuales.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 bg-card rounded-lg">
                    <p className="text-muted-foreground">Tu despensa está vacía. ¡Añade algunos productos!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="shopping-list">
              {shoppingList.length === 0 ? (
                  <div className="text-center py-10 bg-card rounded-lg mt-6">
                  <p className="text-muted-foreground">¡Tu lista de compra está vacía!</p>
                  </div>
              ) : (
                  <>
                  {filteredShoppingList.length === 0 ? (
                      <div className="text-center py-10 bg-card rounded-lg mt-6">
                      <p className="text-muted-foreground">No se encontraron productos con los filtros actuales.</p>
                      </div>
                  ) : (
                      <>
                      {shoppingListNow.length > 0 && (
                          <div className="mt-6">
                          <h2 className="mb-4 text-lg font-semibold tracking-tight">Para comprar ahora ({shoppingListNow.length})</h2>
                          {!groupByCategory ? (
                              <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                              <AnimatePresence>
                                  {shoppingListNow.map(item => (
                                  <ShoppingItemCard
                                      key={`shopping-now-${item.id}`}
                                      layoutId={`shopping-now-${item.id}`}
                                      item={item}
                                      viewMode={viewMode}
                                      onCardClick={handleCardClick}
                                      onToggleBuyLater={handleToggleBuyLater}
                                      onDelete={handleDelete}
                                      onReturnToPantry={handleReturnToPantry}
                                      onEdit={setEditingProduct}
                                      onMarkAsOutOfStock={handleMarkAsOutOfStock}
                                      onDirectStatusChange={handleDirectStatusChange}
                                      isChecking={item.id === checkingItemId}
                                      isSliding={item.id === slidingRightId}
                                  />
                                  ))}
                              </AnimatePresence>
                              </div>
                          ) : (
                              <Accordion type="multiple" value={openShoppingSections} onValueChange={setOpenShoppingSections} className="w-full space-y-2">
                                  <AnimatePresence>
                                  {sortedShoppingListNowCategories.filter(category => groupedShoppingListNow?.[category]).map(category => (
                                      <AccordionItem key={`shopping-now-cat-${category}`} value={category} className="border-none">
                                      <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline rounded-md p-2">
                                          <div className="flex items-center gap-2">{categoryIcons[category as Category]} {category}</div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                          <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                                          <AnimatePresence>
                                              {(groupedShoppingListNow?.[category] || []).map((item) => (
                                                  <ShoppingItemCard
                                                      key={`shopping-now-grouped-${item.id}`}
                                                      layoutId={`shopping-now-grouped-${item.id}`}
                                                      item={item} viewMode={viewMode}
                                                      onCardClick={handleCardClick}
                                                      onToggleBuyLater={handleToggleBuyLater}
                                                      onDelete={handleDelete}
                                                      onReturnToPantry={handleReturnToPantry}
                                                      onEdit={setEditingProduct}
                                                      onMarkAsOutOfStock={handleMarkAsOutOfStock}
                                                      onDirectStatusChange={handleDirectStatusChange}
                                                      isChecking={item.id === checkingItemId}
                                                      isSliding={item.id === slidingRightId}
                                                  />
                                              ))}
                                          </AnimatePresence>
                                          </div>
                                      </AccordionContent>
                                      <Separator className="mt-2" />
                                      </AccordionItem>
                                  ))}
                                  </AnimatePresence>
                              </Accordion>
                          )}
                          </div>
                      )}

                      {shoppingListLater.length > 0 && (
                          <>
                              <Separator className="my-8" />
                              <Accordion type="multiple" value={openShoppingSections} onValueChange={setOpenShoppingSections} className="w-full">
                                  <AccordionItem value="buy-later-section" className="border-none">
                                      <AccordionTrigger className="hover:no-underline">
                                      <h2 className="text-lg font-semibold tracking-tight text-foreground">Comprar otro día ({shoppingListLater.length})</h2>
                                      </AccordionTrigger>
                                      <AccordionContent className="pt-4">
                                          {!groupByCategory ? (
                                              <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                                              <AnimatePresence>
                                                  {shoppingListLater.map(item => (
                                                      <ShoppingItemCard
                                                          key={`shopping-later-${item.id}`}
                                                          layoutId={`shopping-later-${item.id}`}
                                                          item={item} viewMode={viewMode}
                                                          onCardClick={handleCardClick}
                                                          onToggleBuyLater={handleToggleBuyLater} onDelete={handleDelete}
                                                          onReturnToPantry={handleReturnToPantry} onEdit={setEditingProduct}
                                                          onMarkAsOutOfStock={handleMarkAsOutOfStock}
                                                          onDirectStatusChange={handleDirectStatusChange}
                                                          isChecking={item.id === checkingItemId}
                                                          isSliding={item.id === slidingRightId}
                                                      />
                                                  ))}
                                              </AnimatePresence>
                                              </div>
                                          ) : (
                                              <Accordion type="multiple" value={openShoppingSections} onValueChange={setOpenShoppingSections} className="w-full space-y-2">
                                                  <AnimatePresence>
                                                  {sortedShoppingListLaterCategories.filter(category => groupedShoppingListLater?.[category]).map(category => (
                                                      <AccordionItem key={`shopping-later-cat-${category}`} value={category} className="border-none">
                                                      <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline rounded-md p-2">
                                                          <div className="flex items-center gap-2">{categoryIcons[category as Category]} {category}</div>
                                                      </AccordionTrigger>
                                                      <AccordionContent>
                                                          <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col")}>
                                                          <AnimatePresence>
                                                              {(groupedShoppingListLater?.[category] || []).map((item) => (
                                                                  <ShoppingItemCard
                                                                      key={`shopping-later-grouped-${item.id}`}
                                                                      layoutId={`shopping-later-grouped-${item.id}`}
                                                                      item={item} viewMode={viewMode}
                                                                      onCardClick={handleCardClick}
                                                                      onToggleBuyLater={handleToggleBuyLater} onDelete={handleDelete}
                                                                      onReturnToPantry={handleReturnToPantry} onEdit={setEditingProduct}
                                                                      onMarkAsOutOfStock={handleMarkAsOutOfStock}
                                                                      onDirectStatusChange={handleDirectStatusChange}
                                                                      isChecking={item.id === checkingItemId}
                                                                      isSliding={item.id === slidingRightId}
                                                                  />
                                                              ))}
                                                          </AnimatePresence>
                                                          </div>
                                                      </AccordionContent>
                                                      <Separator className="mt-2"/>
                                                      </AccordionItem>
                                                  ))}
                                                  </AnimatePresence>
                                              </Accordion>
                                          )}
                                      </AccordionContent>
                                  </AccordionItem>
                              </Accordion>
                          </>
                      )}
                      </>
                  )}
                  </>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <ShareDialog 
          open={showShareDialog} 
          onOpenChange={setShowShareDialog} 
          pantry={pantry}
          shoppingList={shoppingList}
        />

        <IdentifyProductsDialog open={showIdentifyDialog} onOpenChange={setShowIdentifyDialog} onAddProducts={handleBulkAdd} />
        

        <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>¿Estás seguro?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                className="bg-[#2C0000] text-white hover:bg-[#2C0000]/90"
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
         <Dialog open={showLegendDialog} onOpenChange={setShowLegendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🟦 Leyenda de Colores</DialogTitle>
              <DialogDescription>
                🔄 Puedes tocar una tarjeta para actualizar su estado.
                <br />
                Si lo haces desde la lista de la compra se pondrá en verde y volverá a la despensa automáticamente.
                <br />
                También puedes elegir guardar para otro día sin moverlo todavía.
                <br />
                <br />
                El color de fondo de cada tarjeta indica el estado del producto:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded-full bg-verde-eucalipto shrink-0 border"/>
                  <p className="text-sm"><b>Verde:</b> Producto disponible en tu despensa.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded-full bg-amarillo-mostaza shrink-0 border"/>
                  <p className="text-sm"><b>Ámbar:</b> Queda poca cantidad. Puedes tocar el carrito 🛒 para añadirlo manualmente a la lista de la compra.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded-full bg-rojo-coral shrink-0 border"/>
                  <p className="text-sm"><b>Rojo:</b> Producto agotado. Se añade automáticamente a tu lista de la compra.</p>
                </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowLegendDialog(false)}>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Receta Sugerida</DialogTitle>
              <DialogDescription>
                {isGeneratingRecipe && !recipe ? "Buscando una receta deliciosa con tus ingredientes..." : (recipe ? recipe.title : "")}
              </DialogDescription>
            </DialogHeader>
            {isGeneratingRecipe ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : recipe ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Ingredientes</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {recipe.ingredients.map((ing, i) => <li key={`recipe-ing-${i}-${ing}`}>{ing}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Instrucciones</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    {recipe.instructions.map((step, i) => <li key={`recipe-step-${i}`}>{step}</li>)}
                  </ol>
                </div>
                 <div>
                  <h3 className="font-semibold mb-2 text-primary">Nota del Chef</h3>
                  <p className="text-sm text-muted-foreground italic">{recipe.note}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No se pudo generar la receta. Inténtalo de nuevo.</p>
              </div>
            )}
            <DialogFooter className="flex-row justify-between sm:justify-between w-full">
               <Button variant="outline" onClick={() => setIsRecipeDialogOpen(false)}>Cerrar</Button>
               <Button
                variant="secondary"
                onClick={handleGenerateRecipe}
                disabled={isGeneratingRecipe}
              >
                {isGeneratingRecipe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                Probar otra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar nombre del producto</DialogTitle>
                  <DialogDescription>
                      Cambia el nombre de "{editingProduct?.name}" y pulsa guardar.
                  </DialogDescription>
              </DialogHeader>
              <div className="pt-4">
                  <Label htmlFor="product-name-edit" className="sr-only">
                      Nuevo nombre
                  </Label>
                  <Input
                      id="product-name-edit"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      onKeyDown={(e) => {if (e.key === 'Enter') { e.preventDefault(); handleUpdateName()}}}
                      placeholder="Nuevo nombre del producto"
                      className="bg-gray-800 text-white placeholder-gray-400"
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                  <Button onClick={handleUpdateName}>Guardar cambios</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingFrozenDate} onOpenChange={() => setEditingFrozenDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar fecha de congelación</DialogTitle>
              <DialogDescription>
                Cambia la fecha en que se congeló "{editingFrozenDate?.product.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <Label htmlFor="frozen-date" className="sr-only">
                Fecha de congelación
              </Label>
              <Input
                id="frozen-date"
                type="date"
                value={editingFrozenDate?.date || ''}
                onChange={(e) => setEditingFrozenDate(prev => prev ? { ...prev, date: e.target.value } : null)}
                className="bg-gray-800 text-white"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFrozenDate(null)}>Cancelar</Button>
              <Button onClick={handleUpdateFrozenDate}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Menú flotante de congelar/descongelar */}
        {showFreezeMenu && (
          <div 
            className="fixed z-50 bg-background border rounded-lg shadow-lg p-2"
            style={{ 
              left: showFreezeMenu.x - 50, 
              top: showFreezeMenu.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleFreeze(showFreezeMenu.id)}
              className="flex items-center gap-2"
            >
              {pantry.find(p => p.id === showFreezeMenu.id)?.frozenAt ? (
                <>
                  <span>🔥</span>
                  <span>Descongelar</span>
                </>
              ) : (
                <>
                  <span>❄️</span>
                  <span>Congelar</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
