import type {
    CatalogItem,
    PublicCatalogResponse,
} from "./catalog.types";

function formatRupiah(amount: number): string {
    return `Rp${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(amount)}`;
}

function formatItem(item: CatalogItem): string[] {
    if (item.category === "per-star") {
        const lines = [
            `• *${item.name}* — ${formatRupiah(item.promoPricePerStar)}/star`,
        ];

        if (item.originalPricePerStar !== undefined) {
            lines.push(`  Harga normal: ${formatRupiah(item.originalPricePerStar)}/star`);
        }

        if (item.suppliedBand) {
            lines.push(`  Rentang: ${item.suppliedBand}`);
        }

        return lines;
    }

    if (item.category === "fixed-package") {
        const lines = [`• *${item.name}* — ${formatRupiah(item.price)}`];

        if (item.originalPrice !== undefined) {
            lines.push(`  Harga normal: ${formatRupiah(item.originalPrice)}`);
        }

        if (item.includedQuantity !== undefined) {
            lines.push(`  Termasuk: ${item.includedQuantity} item`);
        }

        if (item.description) {
            lines.push(`  ${item.description}`);
        }

        return lines;
    }

    const route =
        item.sourceRank && item.targetRank
            ? ` (${item.sourceRank} → ${item.targetRank})`
            : "";

    return [
        `• *${item.name}*${route} — ${formatRupiah(item.price)}`,
        ...(item.bonusStars > 0
            ? [`  Bonus: ${item.bonusStars} star`]
            : []),
    ];
}

export function formatPriceList(catalog: PublicCatalogResponse): string {
    if (catalog.categories.length === 0) {
        return "Saat ini belum ada paket Credo Store yang aktif.";
    }

    const lines = [
        "*DAFTAR HARGA CREDO STORE*",
        "Mobile Legends • Joki Rank",
        "",
    ];

    for (const category of catalog.categories) {
        if (category.items.length === 0) continue;

        lines.push(`*— ${category.title.toUpperCase()} —*`);

        for (const item of category.items) {
            lines.push(...formatItem(item));
        }

        lines.push("");
    }

    lines.push(
        "Harga diambil dari katalog aktif Credo Store.",
        "Detail akun, estimasi pengerjaan, dan konfirmasi pesanan dibahas melalui admin.",
    );

    return lines.join("\n").trim();
}
