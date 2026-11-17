export type PerStarCatalogItem = {
    id: string;
    category: "per-star";
    name: string;
    promoPricePerStar: number;
    originalPricePerStar?: number;
    suppliedBand?: string;
};

export type FixedCatalogItem = {
    id: string;
    category: "fixed-package";
    name: string;
    price: number;
    originalPrice?: number;
    description?: string;
    includedQuantity?: number;
};

export type TierProgressionCatalogItem = {
    id: string;
    category: "tier-progression";
    name: string;
    price: number;
    bonusStars: number;
    sourceRank?: string;
    targetRank?: string;
};

export type CatalogItem =
    | PerStarCatalogItem
    | FixedCatalogItem
    | TierProgressionCatalogItem;

export type CatalogCategory = {
    id: string;
    title: string;
    description?: string;
    items: CatalogItem[];
};

export type PublicCatalogResponse = {
    status: "ready";
    generatedAt?: string;
    categories: CatalogCategory[];
    items: CatalogItem[];
};
