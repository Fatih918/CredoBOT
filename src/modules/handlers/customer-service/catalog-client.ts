import type { PublicCatalogResponse } from "./catalog.types";

const DEFAULT_CATALOG_URL =
    "https://credo-store.vercel.app/api/public/catalog";
const CACHE_TTL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 5_000;

let cachedCatalog: PublicCatalogResponse | null = null;
let cachedAt = 0;
let inFlight: Promise<PublicCatalogResponse> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isCatalogItem(value: unknown): boolean {
    if (!isRecord(value)) return false;

    if (
        typeof value.id !== "string" ||
        typeof value.name !== "string" ||
        typeof value.category !== "string"
    ) {
        return false;
    }

    if (value.category === "per-star") {
        return typeof value.promoPricePerStar === "number";
    }

    if (value.category === "fixed-package") {
        return typeof value.price === "number";
    }

    if (value.category === "tier-progression") {
        return (
            typeof value.price === "number" &&
            typeof value.bonusStars === "number"
        );
    }

    return false;
}

function parseCatalogResponse(value: unknown): PublicCatalogResponse {
    if (!isRecord(value) || value.status !== "ready") {
        throw new Error("Credo Store catalog is not ready");
    }

    if (!Array.isArray(value.categories) || !Array.isArray(value.items)) {
        throw new Error("Credo Store catalog response has an invalid shape");
    }

    const categories = value.categories.map((entry) => {
        if (
            !isRecord(entry) ||
            typeof entry.id !== "string" ||
            typeof entry.title !== "string" ||
            !Array.isArray(entry.items) ||
            !entry.items.every(isCatalogItem)
        ) {
            throw new Error("Credo Store catalog contains an invalid category");
        }

        return {
            id: entry.id,
            title: entry.title,
            ...(typeof entry.description === "string"
                ? { description: entry.description }
                : {}),
            items: entry.items as PublicCatalogResponse["items"],
        };
    });

    if (!value.items.every(isCatalogItem)) {
        throw new Error("Credo Store catalog contains an invalid item");
    }

    return {
        status: "ready",
        ...(typeof value.generatedAt === "string"
            ? { generatedAt: value.generatedAt }
            : {}),
        categories,
        items: value.items as PublicCatalogResponse["items"],
    };
}

async function requestCatalog(): Promise<PublicCatalogResponse> {
    const configuredUrl =
        process.env.CREDO_STORE_CATALOG_URL?.trim() || DEFAULT_CATALOG_URL;
    const url = new URL(configuredUrl);

    if (
        url.protocol !== "https:" &&
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1"
    ) {
        throw new Error("Credo Store catalog URL must use HTTPS");
    }

    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Credo Store catalog returned HTTP ${response.status}`);
    }

    return parseCatalogResponse(await response.json());
}

/**
 * Reads the public, active catalog from Credo Store.
 * A short in-memory cache limits outbound requests without retaining stale
 * prices for long. Failed requests are never replaced with static prices.
 */
export async function getPublicCatalog(): Promise<PublicCatalogResponse> {
    if (cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS) {
        return cachedCatalog;
    }

    if (inFlight) return inFlight;

    inFlight = requestCatalog()
        .then((catalog) => {
            cachedCatalog = catalog;
            cachedAt = Date.now();
            return catalog;
        })
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
}
