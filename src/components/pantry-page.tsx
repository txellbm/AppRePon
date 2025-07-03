
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { generateRecipeAction, conversationalAssistantAction, correctProductNameAction } from "@/lib/actions";
import { type Product, type Category, type ProductStatus, type ViewMode, type GenerateRecipeOutput, type ConversationTurn } from "@/lib/types";
import { useReponToast } from "@/hooks/use-repon-toast";
import { useSharedList } from "@/hooks/use-shared-list";
import { IdentifyProductsDialog } from "@/components/identify-products-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { AssistantDialog } from "@/components/assistant-dialog";
import { useAudio } from "@/providers/audio-provider";
import Image from "next/image";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from 'next/navigation';
import { signOut } from '@/services/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
  Volume2,
  VolumeX,
  Loader2,
  RefreshCw,
  ChefHat,
  HelpCircle,
  Settings,
  Filter,
  Sparkles,
  LogOut,
  History,
  MoveUp,
  MoreVertical,
  Undo2,
  Package,
  Pencil,
  ArrowRight,
  Cloudy,
  User,
  Copy,
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

function AddItemForm({ onAddItem, history, pantry, shoppingList, activeTab }: { onAddItem: (name: string) => void, history: string[], pantry: Product[], shoppingList: Product[], activeTab: string }) {
  const [itemName, setItemName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
            placeholder={activeTab === 'pantry' ? "Añadir a la despensa..." : "Añadir a la lista de compra..."}
            className="flex-grow"
          />
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 p-2 flex flex-col gap-1">
              {suggestions.map((suggestion, index) => (
                <button type="button" key={`suggestion-${suggestion}-${index}`} onClick={() => handleSuggestionClick(suggestion)} className="text-left p-2 rounded hover:bg-accent w-full">
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </div>
        <Button type="submit" size="icon" aria-label="Añadir producto">
          <Plus />
        </Button>
      </form>
    </div>
  );
}


function ProductCard({
  product,
  viewMode,
  isPulsing,
  isExiting,
  onUpdateStatus,
  onDelete,
  onAddToShoppingList,
  onUpdateCategory,
  onEdit,
  showArrow
}: {
  product: Product;
  viewMode: ViewMode;
  isPulsing: boolean;
  isExiting: boolean;
  onUpdateStatus: (id: string, status: ProductStatus) => void;
  onDelete: (id: string) => void;
  onAddToShoppingList: (id: string) => void;
  onUpdateCategory: (id: string, category: Category) => void;
  onEdit: (product: Product) => void;
  showArrow: boolean;
}) {
  const handleCycleStatus = () => {
    const statuses: ProductStatus[] = ["available", "low", "out of stock"];
    const currentIndex = statuses.indexOf(product.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateStatus(product.id, nextStatus);
  };

  const statusStyles = {
    available: "border-green-500",
    low: "border-amber-400",
    "out of stock": "border-destructive",
  }[product.status];

  const isListView = viewMode === 'list';

  return (
    <motion.div
      layout
      layoutId={'pantry-' + product.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={isExiting ? { opacity: 0, x: 120, y: 80, rotate: 20, transition: { duration: 0.6 } } : { opacity: 0, x: -50, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-lg transition-all duration-300 hover:shadow-lg border-2 bg-card",
        isListView
          ? "p-2 flex items-center justify-between"
          : "p-4 flex flex-col gap-2",
        statusStyles,
        "cursor-pointer",
        isPulsing && "pulse",
        isExiting && "flash-out"
      )}
      onClick={handleCycleStatus}
    >
      <div className={cn("flex items-center flex-grow gap-3", isListView ? '' : 'flex-col gap-2')}>
        <h3 className={cn("font-semibold", isListView ? '' : 'text-center')}>{product.name}</h3>
      </div>
      
       <div className={cn("shrink-0", isListView ? "flex items-center gap-1" : "flex flex-wrap justify-center gap-1 mt-2")}>
        {product.status === 'low' && (
          product.isPendingPurchase ? (
            <div className="flex items-center justify-center text-xs h-8 px-2 rounded-md bg-amber-100 text-amber-900 border border-amber-400 font-medium">
                Pendiente de compra
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-amber-900 border-amber-400 hover:bg-amber-400/20 hover:text-amber-900"
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
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {showArrow && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 0, x: 20 }}
            transition={{ duration: 1 }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function ShoppingItemCard({
  item,
  viewMode,
  onCheck,
  onCardClick,
  onToggleBuyLater,
  onDelete,
  onReturnToPantry,
  onEdit,
  layoutId,
  isChecking,
  isExiting,
  isMoving
}: {
  item: Product;
  viewMode: ViewMode;
  onCheck: (id: string) => void;
  onCardClick: (id: string) => void;
  onToggleBuyLater: (id: string) => void;
  onDelete: (id: string) => void;
  onReturnToPantry: (id: string) => void;
  onEdit: (product: Product) => void;
  layoutId: string;
  isChecking: boolean;
  isExiting: boolean;
  isMoving: boolean;
}) {
  const cardBorderStyle = {
    available: "border-green-500",
    low: "border-amber-400",
    "out of stock": "border-destructive",
  }[item.status];
      
  const isListView = viewMode === "list";

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: 1,
        x: isExiting ? -60 : 0,
        y: isMoving ? [20, 0] : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
      className={cn(
        "rounded-lg transition-all duration-300 hover:shadow-lg border-2 bg-card text-card-foreground",
        isListView
          ? "p-2 flex items-center justify-between"
          : "p-4 flex flex-col gap-2",
        cardBorderStyle,
        isChecking && "bg-green-100 border-green-500"
      )}
      onClick={() => onCardClick(item.id)}
    >
      <h3 className={cn("font-semibold flex-grow", isListView ? '' : 'text-center')}>{item.name}</h3>
      <div className={cn("shrink-0", isListView ? "flex items-center gap-1" : "flex justify-center gap-2 mt-2")}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-green-500/50 text-green-600 hover:bg-green-500/10"
                      onClick={(e) => { e.stopPropagation(); onCheck(item.id); }}
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Marcar como comprado</p></TooltipContent>
            </Tooltip>
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
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function PantryPage({ listId }: { listId: string }) {
  var a,s;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pantry" | "shopping-list">("pantry");
  const { toast } = useReponToast({ audioDisabled: activeTab === 'shopping-list' });
  const { pantry, shoppingList, history, isLoaded, hasPendingWrites, handleAddItem, handleBulkAdd, updateRemoteList, handleShoppingListAddItem } = useSharedList(listId, toast);
  
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ by: 'name', order: 'asc' });
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showIdentifyDialog, setShowIdentifyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLegendDialog, setShowLegendDialog] = useState(false);
  const [pulsingProductId, setPulsingProductId] = useState<string | null>(null);
  const [exitingProductId, setExitingProductId] = useState<string | null>(null);
  const [lowArrowId, setLowArrowId] = useState<string | null>(null);
  const [checkingItemId, setCheckingItemId] = useState<string | null>(null);
  const [exitingShoppingId, setExitingShoppingId] = useState<string | null>(null);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [recipe, setRecipe] = useState<GenerateRecipeOutput | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  
  const { isAudioEnabled, toggleAudio, playAudio } = useAudio();

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [openShoppingSections, setOpenShoppingSections] = useState<string[]>(['buy-later-section']);
  const prevPantryRef = useRef<Product[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState("");

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
        const { correctedName } = await correctProductNameAction({ productName: finalNewName });
        
        const oldName = editingProduct.name;
        
        const existsInPantry = pantry.some(p => p.id === editingProduct.id);
        const existsInShopping = shoppingList.some(p => p.id === editingProduct.id);

        const nameExistsInPantry = existsInPantry &&
            pantry.some(p => p.name.toLowerCase() === correctedName.toLowerCase() && p.id !== editingProduct.id);
        const nameExistsInShopping = existsInShopping &&
            shoppingList.some(p => p.name.toLowerCase() === correctedName.toLowerCase() && p.id !== editingProduct.id);

        const nameExists = nameExistsInPantry || nameExistsInShopping;
        
        if (nameExists) {
            toastie.update({
                id: toastie.id,
                title: "Error: Producto duplicado",
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
        
        updateRemoteList({
            pantry: newPantry,
            shoppingList: newShoppingList,
            history: newHistory,
        });

        toastie.update({
            id: toastie.id,
            title: "¡Nombre actualizado!",
            description: `"${oldName}" ahora es "${correctedName}".`
        });

    } catch (error) {
        console.error("Error updating product name:", error);
        toastie.update({
            id: toastie.id,
            title: "Error",
            description: "No se pudo actualizar el nombre del producto.",
            variant: "destructive"
        });
    } finally {
        setEditingProduct(null);
    }
  };


  const filterOptions: Record<"pantry" | "shopping-list", {value: ProductStatus | 'all', label: string}[]> = {
    pantry: [
        { value: 'all', label: 'Todos' },
        { value: 'available', label: 'Disponibles' },
        { value: 'low', label: 'Queda poco' },
    ],
    'shopping-list': [
        { value: 'all', label: 'Todos' },
        { value: 'out of stock', label: 'Agotados' },
        { value: 'low', label: 'Poco stock' },
    ],
  };
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

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
    try {
      const savedViewMode = localStorage.getItem('repon-viewMode') as ViewMode | null;
      if (savedViewMode && ['list', 'grid'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
    } catch (error) {
        console.warn("Could not access localStorage for viewMode");
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('repon-viewMode', viewMode);
    } catch (error) {
        console.warn("Could not access localStorage for viewMode");
    }
  }, [viewMode]);

  useEffect(() => {
    if (isAssistantOpen) {
      setAssistantStatus('listening');
    } else {
      setAssistantStatus('idle');
    }
  }, [isAssistantOpen]);

  useEffect(() => {
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
    prevPantryRef.current = pantry;
  }, [pantry, groupByCategory, openCategories.length]);
  
  useEffect(() => {
    if (groupByCategory) {
      const allCategories = [...new Set([...pantry.map(p => p.category), ...shoppingList.map(p => p.category)])];
      setOpenCategories(allCategories.filter((c): c is Category => c !== undefined));
    }
  }, [groupByCategory, pantry, shoppingList]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('repon-dev-mode');
    } catch(e) {
      console.warn("Could not remove dev mode flag from localStorage.");
    }
    
    await signOut();
    window.location.href = '/';
  };

  const handleUpdateStatus = async (id: string, status: ProductStatus) => {
    const product = pantry.find(p => p.id === id);
    if (!product) return;

    setPulsingProductId(id);
    setTimeout(() => setPulsingProductId(null), 500);
    
    let newPantry = [...pantry];
    let newShoppingList = [...shoppingList];

    if (status === 'out of stock') {
        setExitingProductId(id);
        setTimeout(async () => {
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
            updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
            setExitingProductId(null);
        }, 1000);
        return;
    }

    newPantry = pantry.map(p => (p.id === id ? { ...p, status, isPendingPurchase: status === 'available' ? false : p.isPendingPurchase } : p));
    
    if (status === 'available') {
      const shoppingListItem = shoppingList.find(item => item.id === product.id);
      if (shoppingListItem && shoppingListItem.reason === 'low') {
        newShoppingList = shoppingList.filter(item => item.id !== product.id);
      }
    }

    if (status === 'low') {
      setLowArrowId(id);
      setTimeout(() => setLowArrowId(null), 1000);
    }

    updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
  };

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
        updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
        toast({ title: '¡Categoría cambiada!', description: `"${productName}" ahora está en "${newCategory}".` });
    }
  };

  const handleDelete = (id: string) => {
    const itemInShoppingList = shoppingList.find(p => p.id === id);
    
    let newPantry = pantry.filter(p => p.id !== id);
    let newShoppingList = shoppingList.filter(p => p.id !== id);

    if (itemInShoppingList && itemInShoppingList.reason === 'low') {
        newPantry = newPantry.map(p => p.name.toLowerCase() === itemInShoppingList.name.toLowerCase() ? {...p, isPendingPurchase: false } : p);
    }
    
    updateRemoteList({
        pantry: newPantry,
        shoppingList: newShoppingList,
    });

    toast({ title: "¡Adiós, producto!" });
    setConfirmDeleteId(null);
  };
  
  const handleCheckShoppingItem = async (id: string) => {
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
  };

  const handleCheckWithAnimation = (id: string) => {
    setCheckingItemId(id);
    setTimeout(() => {
      setCheckingItemId(null);
      setExitingShoppingId(id);
      setTimeout(() => {
        handleCheckShoppingItem(id);
        setExitingShoppingId(null);
      }, 300);
    }, 1000);
  };

  const handleCardClick = (id: string) => {
    setCheckingItemId(id);
    setTimeout(() => {
      setCheckingItemId(null);
      setExitingShoppingId(id);
      setTimeout(() => {
        handleCheckShoppingItem(id);
        setExitingShoppingId(null);
      }, 300);
    }, 1000);
  };
  
  const handleLowStockToShoppingList = async (id: string) => {
    const product = pantry.find(p => p.id === id);
    if (!product || product.status !== 'low') return;

    setPulsingProductId(id);
    setTimeout(() => setPulsingProductId(null), 500);

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
  };

  const handleToggleBuyLater = (id: string) => {
    const item = shoppingList.find(p => p.id === id);
    if (!item) return;

    const newShoppingList = shoppingList.map(p =>
      p.id === id ? { ...p, buyLater: !p.buyLater } : p
    );
    setMovingItemId(id);
    updateRemoteList({ shoppingList: newShoppingList });
    setTimeout(() => setMovingItemId(null), 300);

    // transition without notifications
  };

  const handleReturnToPantry = (id: string) => {
    const itemInShoppingList = shoppingList.find(p => p.id === id);
    if (!itemInShoppingList || itemInShoppingList.status !== 'low') {
        return;
    }
    setExitingShoppingId(id);
    setTimeout(() => {
        const newPantry = pantry.map(p => {
            if (p.id === itemInShoppingList.id) {
                return { ...p, isPendingPurchase: false };
            }
            return p;
        });

        const newShoppingList = shoppingList.filter(p => p.id !== id);

        updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList });
        setExitingShoppingId(null);
    }, 300);
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
      const result = await generateRecipeAction({
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
  
  const handleAssistantCommand = async (command: string) => {
    if (!command.trim()) return;

    setAssistantStatus('thinking');
    setConversation(prev => [...prev, { id: uuidv4(), speaker: 'user', text: command }]);

    const result = await conversationalAssistantAction({
        command,
        pantry,
        shoppingList,
        activeTab
    });

    setConversation(prev => [...prev, { id: uuidv4(), speaker: 'assistant', text: result.response }]);
    setAssistantStatus('speaking');
    
    playAudio(result.response, () => {
        setAssistantStatus('listening');
    });

    result.operations?.forEach(op => {
      const opItemNameLower = op.item.toLowerCase();
      switch (op.action) {
        case 'add':
          if (op.list === 'pantry') handleAddItem(op.item);
          else if (op.list === 'shopping') handleShoppingListAddItem(op.item);
          break;
        case 'remove': {
          const itemToRemove = [...pantry, ...shoppingList].find(p => p.name.toLowerCase() === opItemNameLower);
          if (itemToRemove) handleDelete(itemToRemove.id);
          break;
        }
        case 'move': {
           const itemInPantry = pantry.find(p => p.name.toLowerCase() === opItemNameLower);
           const itemInShopping = shoppingList.find(p => p.name.toLowerCase() === opItemNameLower);
           
           if (op.from === 'pantry' && op.to === 'shopping' && itemInPantry) {
              handleUpdateStatus(itemInPantry.id, 'out of stock');
           } else if (op.from === 'shopping' && op.to === 'pantry' && itemInShopping) {
              handleCheckShoppingItem(itemInShopping.id);
           } else if (op.to === 'pantry') {
              handleAddItem(op.item);
           } else if (op.to === 'shopping') {
              handleShoppingListAddItem(op.item);
           }
           break;
        }
      }
    });

    result.uiActions?.forEach(action => {
        switch(action.action) {
            case 'change_tab':
                setActiveTab(action.payload.tab);
                break;
            case 'change_view':
                setViewMode(action.payload.viewMode);
                break;
            case 'apply_filter':
                setStatusFilter(action.payload.value);
                break;
        }
    });
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
        .filter(p => statusFilter === 'all' || p.status === statusFilter)
        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  const filteredPantry = useMemo(() => sortedAndFiltered(pantry), [pantry, sortConfig, statusFilter, searchQuery]);
  const filteredShoppingList = useMemo(() => sortedAndFiltered(shoppingList), [shoppingList, sortConfig, statusFilter, searchQuery]);

  const shoppingListNow = useMemo(() => filteredShoppingList.filter(p => !p.buyLater), [filteredShoppingList]);
  const shoppingListLater = useMemo(() => filteredShoppingList.filter(p => p.buyLater), [filteredShoppingList]);

  const groupedPantry = useMemo(() => {
    if (!groupByCategory) return null;
    return filteredPantry.reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredPantry, groupByCategory]);
  
  const sortedPantryCategories = useMemo(() => groupedPantry ? Object.keys(groupedPantry).sort() : [], [groupedPantry]);
  
  const groupedShoppingListNow = useMemo(() => {
    if (!groupByCategory) return null;
    return shoppingListNow.reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [shoppingListNow, groupByCategory]);
  
  const sortedShoppingListNowCategories = useMemo(() => groupedShoppingListNow ? Object.keys(groupedShoppingListNow).sort() : [], [groupedShoppingListNow]);
  
  const groupedShoppingListLater = useMemo(() => {
    if (!groupByCategory) return null;
    return shoppingListLater.reduce((acc, product) => {
      const category = product.category || "Otros";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [shoppingListLater, groupByCategory]);
  
  const sortedShoppingListLaterCategories = useMemo(() => groupedShoppingListLater ? Object.keys(groupedShoppingListLater).sort() : [], [groupedShoppingListLater]);

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        toast({ title: "¡Enlace copiado!", description: "Ya puedes compartir la lista con quien quieras." });
    }, () => {
        toast({
            title: "No se pudo copiar el enlace",
            description: "Esta función podría no estar disponible en tu navegador. Intenta copiar la URL manualmente.",
            duration: 5000,
            variant: "destructive"
        });
    });
  };

  const currentAddItemHandler = activeTab === 'pantry' ? handleAddItem : handleShoppingListAddItem;
  const currentFilterOptions = filterOptions[activeTab] || filterOptions.pantry;

  if (authLoading || !isLoaded || !user) {
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
      <DropdownMenuSeparator />
      <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none">
          <Label htmlFor="group-by-category-mobile" className="flex items-center gap-2 flex-grow pr-2">
            <Tags className="h-4 w-4" /> <span>Agrupar</span>
          </Label>
          <Switch id="group-by-category-mobile" checked={groupByCategory} onCheckedChange={setGroupByCategory} />
      </div>
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-primary tracking-tighter">RePon</h1>
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
                              <Button variant="ghost" size="icon" onClick={toggleAudio}>
                                  {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{isAudioEnabled ? 'Silenciar notificaciones' : 'Activar sonido'}</p>
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-9 w-9">
                           <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Avatar'} />
                            <AvatarFallback>
                                {user.isAnonymous ? <User className="h-5 w-5" /> : (user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?')}
                           </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                           <p className="text-sm font-medium leading-none">
                             {user.isAnonymous ? 'Sesión de Invitado' : user.displayName}
                           </p>
                           {user.email && (
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                           )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={handleSignOut} className={user.isAnonymous ? "text-destructive focus:text-destructive focus:bg-destructive/10" : ""}>
                            {user.isAnonymous ? <Trash2 className="mr-2 h-4 w-4" /> : <LogOut className="mr-2 h-4 w-4" />}
                            <span>{user.isAnonymous ? 'Descartar y Salir' : 'Cerrar sesión'}</span>
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowAddItem(s => !s)} aria-label="Añadir producto">
                                          <Plus className="h-5 w-5" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Añadir producto</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowIdentifyDialog(true)} aria-label="Añadir desde foto">
                                          <Camera className="h-5 w-5" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Añadir desde foto</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsAssistantOpen(true)} aria-label="Asistente de IA">
                                          <Sparkles className="h-5 w-5" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Asistente IA</p></TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      </div>
                      <div className="flex items-center">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(!showSearch)} aria-label="Buscar productos">
                              <Search className="h-5 w-5" />
                          </Button>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9">
                                      <Settings className="h-5 w-5" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <ViewAndSortOptions />
                                  <DropdownMenuSeparator/>
                                  <FilterOptions/>
                              </DropdownMenuContent>
                          </DropdownMenu>
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
                     <Label
                      htmlFor="group-by-category"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 h-9 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span>Agrupar</span>
                      <Switch id="group-by-category" checked={groupByCategory} onCheckedChange={setGroupByCategory} />
                    </Label>
                    
                    <Separator orientation="vertical" className="h-6 mx-1" />

                    <TooltipProvider>
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsAssistantOpen(true)} aria-label="Asistente de IA">
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Asistente IA</p>
                        </TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowIdentifyDialog(true)} aria-label="Añadir desde foto">
                                <Camera className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Añadir desde foto</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button onClick={() => setShowAddItem(s => !s)} className="h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir producto
                    </Button>
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
                      className="pl-10 w-full bg-card"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowSearch(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showAddItem && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <AddItemForm
                            onAddItem={currentAddItemHandler}
                            history={history}
                            pantry={pantry}
                            shoppingList={shoppingList}
                            activeTab={activeTab}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
          
          <TabsContent value="pantry">
            <div className="mt-6">
              {pantry.length > 0 ? (
                filteredPantry.length > 0 ? (
                  !groupByCategory ? (
                    <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                      <AnimatePresence>
                        {filteredPantry.map(product => (
                          <ProductCard
                            key={`pantry-${product.id}`}
                            product={product}
                            viewMode={viewMode}
                            isPulsing={product.id === pulsingProductId}
                            isExiting={product.id === exitingProductId}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={() => setConfirmDeleteId(product.id)}
                            onAddToShoppingList={handleLowStockToShoppingList}
                            onUpdateCategory={handleUpdateCategory}
                            onEdit={setEditingProduct}
                            showArrow={product.id === lowArrowId}
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
                                  <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                                  <AnimatePresence>
                                      {(groupedPantry?.[category] || []).map((product) => (
                                      <ProductCard
                                        key={`pantry-grouped-${product.id}`}
                                        product={product}
                                        viewMode={viewMode}
                                        isPulsing={product.id === pulsingProductId}
                                        isExiting={product.id === exitingProductId}
                                        onUpdateStatus={handleUpdateStatus}
                                        onDelete={() => setConfirmDeleteId(product.id)}
                                        onAddToShoppingList={handleLowStockToShoppingList}
                                        onUpdateCategory={handleUpdateCategory}
                                        onEdit={setEditingProduct}
                                        showArrow={product.id === lowArrowId}
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
                            <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                            <AnimatePresence>
                                {shoppingListNow.map(item => (
                                <ShoppingItemCard
                                    key={`shopping-now-${item.id}`}
                                    layoutId={`shopping-now-${item.id}`}
                                    item={item}
                                    viewMode={viewMode}
                                    onCheck={handleCheckWithAnimation}
                                    onCardClick={handleCardClick}
                                    onToggleBuyLater={handleToggleBuyLater}
                                    onDelete={() => setConfirmDeleteId(item.id)}
                                    onReturnToPantry={handleReturnToPantry}
                                    onEdit={setEditingProduct}
                                    isChecking={item.id === checkingItemId}
                                    isExiting={item.id === exitingShoppingId}
                                    isMoving={item.id === movingItemId}
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
                                        <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                                        <AnimatePresence>
                                            {(groupedShoppingListNow?.[category] || []).map((item) => (
                                                <ShoppingItemCard
                                                    key={`shopping-now-grouped-${item.id}`}
                                                    layoutId={`shopping-now-grouped-${item.id}`}
                                                    item={item} viewMode={viewMode}
                                                    onCheck={handleCheckWithAnimation}
                                                    onCardClick={handleCardClick}
                                                    onToggleBuyLater={handleToggleBuyLater} onDelete={() => setConfirmDeleteId(item.id)}
                                                    onReturnToPantry={handleReturnToPantry} onEdit={setEditingProduct}
                                                    isChecking={item.id === checkingItemId}
                                                    isExiting={item.id === exitingShoppingId}
                                                    isMoving={item.id === movingItemId}
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
                                            <div className={cn("gap-2", viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                                            <AnimatePresence>
                                                {shoppingListLater.map(item => (
                                                    <ShoppingItemCard
                                                        key={`shopping-later-${item.id}`}
                                                        layoutId={`shopping-later-${item.id}`}
                                                        item={item} viewMode={viewMode}
                                                        onCheck={handleCheckWithAnimation}
                                                        onCardClick={handleCardClick}
                                                        onToggleBuyLater={handleToggleBuyLater} onDelete={() => setConfirmDeleteId(item.id)}
                                                        onReturnToPantry={handleReturnToPantry} onEdit={setEditingProduct}
                                                        isChecking={item.id === checkingItemId}
                                                        isExiting={item.id === exitingShoppingId}
                                                        isMoving={item.id === movingItemId}
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
                                                        <div className={cn("gap-2 pt-2", viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col")}>
                                                        <AnimatePresence>
                                                            {(groupedShoppingListLater?.[category] || []).map((item) => (
                                                                <ShoppingItemCard
                                                                    key={`shopping-later-grouped-${item.id}`}
                                                                    layoutId={`shopping-later-grouped-${item.id}`}
                                                                    item={item} viewMode={viewMode}
                                                                    onCheck={handleCheckWithAnimation}
                                                                    onCardClick={handleCardClick}
                                                                    onToggleBuyLater={handleToggleBuyLater} onDelete={() => setConfirmDeleteId(item.id)}
                                                                    onReturnToPantry={handleReturnToPantry} onEdit={setEditingProduct}
                                                                    isChecking={item.id === checkingItemId}
                                                                    isExiting={item.id === exitingShoppingId}
                                                                    isMoving={item.id === movingItemId}
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
      
      <AssistantDialog 
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        conversation={conversation}
        assistantStatus={assistantStatus}
        onCommand={handleAssistantCommand}
      />

      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>¿Estás seguro?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showLegendDialog} onOpenChange={setShowLegendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leyenda de Colores</DialogTitle>
            <DialogDescription>
              Los colores del borde de cada producto te ayudan a conocer su estado de un vistazo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full bg-green-500 shrink-0 border"/>
                <p className="text-sm"><b>Verde:</b> Producto disponible en tu despensa.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full bg-amber-400 shrink-0 border"/>
                <p className="text-sm"><b>Ámbar:</b> Queda poca cantidad del producto.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded-full bg-destructive shrink-0 border"/>
                <p className="text-sm"><b>Rojo:</b> Producto agotado o que necesitas comprar.</p>
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
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                <Button onClick={handleUpdateName}>Guardar cambios</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
