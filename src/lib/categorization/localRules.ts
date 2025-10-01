import type { Category } from "@/lib/types";

export const VALID_CATEGORIES: Category[] = [
  "Frutas y Verduras",
  "Lácteos y Huevos",
  "Proteínas",
  "Panadería y Cereales",
  "Aperitivos",
  "Bebidas",
  "Hogar y Limpieza",
  "Condimentos y Especias",
  "Conservas y Despensa",
  "Otros"
];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  "Frutas y Verduras": [
    "manzana",
    "pera",
    "platano",
    "banana",
    "naranja",
    "limon",
    "mandarina",
    "fresa",
    "frambuesa",
    "mora",
    "uva",
    "melocoton",
    "albaricoque",
    "cereza",
    "sandia",
    "melon",
    "kiwi",
    "mango",
    "papaya",
    "aguacate",
    "tomate",
    "lechuga",
    "espinaca",
    "acelga",
    "col",
    "coliflor",
    "brocoli",
    "calabacin",
    "calabaza",
    "pepino",
    "zanahoria",
    "pimiento",
    "cebolla",
    "ajo",
    "patata",
    "boniato",
    "remolacha",
    "berenjena",
    "apio",
    "seta",
    "champinon",
    "hongo",
    "fruta",
    "verdura",
    "ensalada"
  ],
  "Lácteos y Huevos": [
    "leche",
    "yogur",
    "yogurt",
    "queso",
    "mantequilla",
    "margarina",
    "nata",
    "crema",
    "requeson",
    "cuajada",
    "huevo",
    "lacteo",
    "kefir"
  ],
  "Proteínas": [
    "pollo",
    "pavo",
    "cerdo",
    "ternera",
    "vacuno",
    "buey",
    "cordero",
    "cabrito",
    "conejo",
    "carne",
    "filete",
    "bistec",
    "solomillo",
    "chuleta",
    "costilla",
    "lomo",
    "embutido",
    "jamon",
    "salchicha",
    "chorizo",
    "mortadela",
    "salami",
    "hamburguesa",
    "albondiga",
    "tofu",
    "seitan",
    "tempeh",
    "higado",
    "pescado fresco",
    "marisco",
    "gamba",
    "langostino",
    "atun fresco",
    "salmon",
    "merluza"
  ],
  "Panadería y Cereales": [
    "pan",
    "baguette",
    "barra",
    "bolleria",
    "croissant",
    "magdalena",
    "bizcocho",
    "galleta",
    "cereal",
    "muesli",
    "granola",
    "avena",
    "cuscus",
    "quinoa",
    "arroz",
    "pasta",
    "macarron",
    "espagueti",
    "fideo",
    "lasana",
    "masa",
    "harina",
    "maizena",
    "maiz",
    "trigo",
    "centeno",
    "integral",
    "tortita",
    "cacao",
    "cacao en polvo",
    "polvo de cacao",
    "cacao puro",
    "semilla",
    "semilla de chia",
    "semilla de lino",
    "semilla de girasol",
    "semilla de calabaza",
    "semillas",
    "gofio"
  ],
  "Aperitivos": [
    "snack",
    "aperitivo",
    "patata frita",
    "chips",
    "nacho",
    "palomita",
    "fruto seco",
    "cacahuete",
    "almendra",
    "pistacho",
    "anacardo",
    "nuez",
    "mix de frutos",
    "barrita",
    "barrita energetica",
    "regaliz",
    "chuche",
    "gominola"
  ],
  "Bebidas": [
    "agua",
    "refresco",
    "cola",
    "soda",
    "zumo",
    "jugo",
    "bebida",
    "cerveza",
    "vino",
    "cava",
    "champan",
    "sidra",
    "licor",
    "ron",
    "whisky",
    "vodka",
    "te",
    "infusion",
    "manzanilla",
    "poleo",
    "tila",
    "cafe",
    "expreso",
    "capuchino",
    "batido",
    "bebida vegetal",
    "horchata"
  ],
  "Hogar y Limpieza": [
    "lejia",
    "limpiador",
    "limpieza",
    "detergente",
    "suavizante",
    "lavavajillas",
    "jabon",
    "gel",
    "champu",
    "acondicionador",
    "ambientador",
    "desodorante",
    "esponja",
    "estropajo",
    "bayeta",
    "trapo",
    "fregona",
    "escoba",
    "cubo",
    "guante",
    "papel higienico",
    "papel de cocina",
    "servilleta",
    "panuelo",
    "papel aluminio",
    "aluminio",
    "film",
    "plastico",
    "bolsa basura",
    "bolsa de basura",
    "basura",
    "bolsa reciclaje",
    "reciclaje",
    "insecticida",
    "desinfectante",
    "limpiacristales",
    "multiusos",
    "desengrasante",
    "panal",
    "higiene",
    "higiene personal"
  ],
  "Condimentos y Especias": [
    "aceite",
    "vinagre",
    "sal",
    "pimienta",
    "oregano",
    "comino",
    "curcuma",
    "pimenton",
    "hierba",
    "especia",
    "aderezo",
    "mostaza",
    "mayonesa",
    "salsa",
    "soja",
    "barbacoa",
    "ketchup",
    "alioli",
    "ajo en polvo",
    "cebolla en polvo",
    "caldo",
    "pastilla",
    "bouillon",
    "laurel",
    "canela",
    "vainilla",
    "nuez moscada",
    "clavo",
    "perejil",
    "cilantro"
  ],
  "Conservas y Despensa": [
    "conserva",
    "lata",
    "enlatado",
    "tarro",
    "bote",
    "frasco",
    "atun",
    "sardina",
    "mejillon",
    "berberecho",
    "caballa",
    "anchoa",
    "pulpo",
    "calamar",
    "almeja",
    "maiz dulce",
    "garbanzo",
    "lenteja",
    "alubia",
    "judia",
    "habichuela",
    "tomate frito",
    "tomate triturado",
    "pure de tomate",
    "pisto",
    "mermelada",
    "crema de cacahuete",
    "miel",
    "sirope",
    "sopa instantanea",
    "caldo en brick",
    "leche condensada",
    "leche evaporada",
    "coco rallado",
    "aceituna",
    "alcaparra",
    "pepinillo",
    "brotes",
    "brotes de soja",
    "noodle",
    "ramen",
    "sazonador"
  ],
  "Otros": []
};

const keywordCategoryPairs: Array<{ keyword: string; category: Category }> = Object.entries(CATEGORY_KEYWORDS)
  .flatMap(([category, keywords]) =>
    keywords.map((keyword) => ({
      keyword: normalizeForCategorization(keyword),
      category: category as Category,
    }))
  )
  .sort((a, b) => b.keyword.length - a.keyword.length);

export type LocalCategorizationMatch = {
  category: Category | null;
  keyword?: string;
  normalizedName: string;
};

export function normalizeForCategorization(value: string): string {
  const withoutDiacritics = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const singularized = withoutDiacritics
    .split(/\s+/)
    .map((word) => singularize(word))
    .filter(Boolean)
    .join(" ");

  return singularized;
}

function singularize(word: string): string {
  if (word.length <= 3) {
    return word;
  }

  if (word.endsWith("ces")) {
    return word.slice(0, -3) + "z";
  }

  if (word.endsWith("es") && word.length > 4) {
    return word.slice(0, -2);
  }

  if (word.endsWith("s") && word.length > 3) {
    return word.slice(0, -1);
  }

  return word;
}

export function categorizeWithLocalRules(name: string): LocalCategorizationMatch {
  const normalizedName = normalizeForCategorization(name);

  for (const { keyword, category } of keywordCategoryPairs) {
    if (keyword && normalizedName.includes(keyword)) {
      return { category, keyword, normalizedName };
    }
  }

  return { category: null, normalizedName };
}

export function isValidCategory(value: string | null | undefined): value is Category {
  if (!value) return false;
  return VALID_CATEGORIES.includes(value as Category);
}

export function ensureValidCategory(value: string | null | undefined): Category {
  return isValidCategory(value) ? (value as Category) : "Otros";
}

export const CATEGORY_KEYWORDS_MAP = CATEGORY_KEYWORDS;
