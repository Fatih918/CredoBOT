import test from "node:test";
import assert from "node:assert/strict";
import { resolveConfiguredFaq } from "../dist/modules/handlers/customer-service/customer-service-config.service.js";

const entries = [
    { id: "first", title: "Payment", keywords: ["qris", "transfer"], response: "Payment details" },
    { id: "second", title: "Guarantee", keywords: ["garansi"], response: "Guarantee details" },
];

test("matches configured FAQ keywords case-insensitively", () => {
    assert.equal(resolveConfiguredFaq("BISA QRIS?", entries), "Payment details");
    assert.equal(resolveConfiguredFaq("cara transfer", entries), "Payment details");
});

test("returns null when no configured keyword matches", () => {
    assert.equal(resolveConfiguredFaq("berapa harganya?", entries), null);
    assert.equal(resolveConfiguredFaq("", entries), null);
    assert.equal(resolveConfiguredFaq(undefined, entries), null);
});

test("uses the first matching FAQ entry deterministically", () => {
    const overlapping = [
        { id: "one", title: "A", keywords: ["pembayaran"], response: "First" },
        { id: "two", title: "B", keywords: ["pembayaran"], response: "Second" },
    ];
    assert.equal(resolveConfiguredFaq("metode pembayaran", overlapping), "First");
});
