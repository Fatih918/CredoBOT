import test from "node:test";
import assert from "node:assert/strict";
import {
    formatCustomerServiceFaq,
    formatCustomerServiceWelcome,
    resolveCustomerServiceFaq,
} from "../dist/modules/handlers/customer-service/customer-service-faq.js";

test("recognizes price-list, order, services, and greeting intents", () => {
    assert.equal(resolveCustomerServiceFaq("harga dong"), "price-list");
    assert.equal(resolveCustomerServiceFaq("berapa tarifnya?"), "price-list");
    assert.equal(resolveCustomerServiceFaq("cara order gimana"), "how-to-order");
    assert.equal(resolveCustomerServiceFaq("mau pesan"), "how-to-order");
    assert.equal(resolveCustomerServiceFaq("ada layanan apa?"), "services");
    assert.equal(resolveCustomerServiceFaq("joki rank"), "services");
    assert.equal(resolveCustomerServiceFaq("Assalamualaikum"), "greeting");
    assert.equal(resolveCustomerServiceFaq("selamat malam"), "greeting");
});

test("does not invent answers for unsupported topics", () => {
    assert.equal(resolveCustomerServiceFaq("bisa bayar QRIS?"), null);
    assert.equal(resolveCustomerServiceFaq("berapa lama pengerjaannya?"), null);
    assert.equal(resolveCustomerServiceFaq("ada garansi?"), null);
    assert.equal(resolveCustomerServiceFaq(""), null);
});

test("order FAQ follows the actual storefront ordering flow", () => {
    const answer = formatCustomerServiceFaq("how-to-order");
    assert.match(answer, /Pilih layanan atau paket/);
    assert.match(answer, /isi detail pesanan/);
    assert.match(answer, /Periksa ringkasan pesanan/);
    assert.match(answer, /konfirmasi dengan toko/);
    assert.match(answer, /https:\/\/credo-store\.vercel\.app\/paket/);
});

test("welcome provides supported keywords without claiming human handover", () => {
    const welcome = formatCustomerServiceWelcome();
    assert.match(welcome, /Selamat datang di Credo Store/);
    assert.match(welcome, /harga/);
    assert.match(welcome, /cara order/);
    assert.match(welcome, /layanan/);
});
