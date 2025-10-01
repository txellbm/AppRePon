export type ProductStatus = 'available' | 'low' | 'out of stock';
export type ViewMode = 'list' | 'grid';
export type Category = 
  | "Frutas y Verduras"
  | "Lácteos y Huevos"
  | "Proteínas"
  | "Panadería y Cereales"
  | "Aperitivos"
  | "Bebidas"
  | "Hogar y Limpieza"
  | "Condimentos y Especias"
  | "Conservas y Despensa"
  | "Otros";

export interface Product {
  id: string;
  name: string;
  category: Category;
  status: ProductStatus;
  reason?: 'low' | 'out of stock';
  isPendingPurchase: boolean;
  buyLater: boolean;
  frozenAt?: number; // Timestamp de cuando se congeló el producto
}

export type MessageType = 'low_stock' | 'out_of_stock' | 'moved_to_shopping_list' | 'added_to_pantry' | 'available' | 'out_of_stock_and_moved' | 'added_to_shopping_list';

export interface GenerateGrammaticalMessageInput {
  productName: string;
  messageType: MessageType;
}

export interface GenerateGrammaticalMessageOutput {
  message: string;
}

