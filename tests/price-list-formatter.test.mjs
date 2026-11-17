import test from "node:test";
import assert from "node:assert/strict";
import { formatPriceList } from "../dist/modules/handlers/customer-service/price-list.formatter.js";

test("formats per-star, fixed, and tier-progression catalog items", () => {
    const output = formatPriceList({
        status: "ready",
        categories: [
            {
                id: "joki-perbintang",
                title: "Joki Perbintang",
                items: [
                    {
                        id: "epic",
                        category: "per-star",
                        name: "Epic",
                        promoPricePerStar: 4500,
                        originalPricePerStar: 6000,
                    },
                ],
            },
            {
                id: "paket-tetap",
                title: "Paket Tetap",
                items: [
                    {
                        id: "epic-10-stars",
                        category: "fixed-package",
                        name: "10 Stars Epic",
                        price: 40000,
                        includedQuantity: 10,
                    },
                ],
            },
            {
                id: "tier-progression",
                title: "Tier Progression",
                items: [
                    {
                        id: "epic-v-to-mythic",
                        category: "tier-progression",
                        name: "Epic V → Mythic",
                        price: 235000,
                        bonusStars: 1,
                        sourceRank: "Epic V",
                        targetRank: "Mythic",
                    },
                ],
            },
        ],
        items: [],
    });

    assert.match(output, /JOKI PERBINTANG/);
    assert.match(output, /Rp4\.500\/star/);
    assert.match(output, /Harga normal: Rp6\.000\/star/);
    assert.match(output, /10 Stars Epic.*Rp40\.000/);
    assert.match(output, /Epic V.*Mythic.*Rp235\.000/);
    assert.match(output, /Bonus: 1 star/);
});

test("returns an explicit empty-catalog message", () => {
    assert.equal(
        formatPriceList({ status: "ready", categories: [], items: [] }),
        "Saat ini belum ada paket Credo Store yang aktif.",
    );
});
