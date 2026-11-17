export type CustomerServiceFaqIntent =
    | "price-list"
    | "how-to-order"
    | "services"
    | "greeting";

const PRICE_LIST_PATTERN =
    /(?:\b(?:harga|tarif|price\s*list)\b|\bdaftar\s+harga\b|\blist\s+harga\b|\bpaket\s+harga\b)/i;
const ORDER_PATTERN =
    /(?:\b(?:cara|bagaimana)\s+(?:untuk\s+)?(?:order|pesan|pemesanan)\b|\b(?:mau|ingin)\s+(?:order|pesan)\b|\b(?:order|pesan|pemesanan)\s+(?:gimana|bagaimana|caranya)\b|\bhow\s+to\s+order\b)/i;
const SERVICE_PATTERN =
    /(?:\b(?:layanan|service|joki|per\s*star|tier\s*progression)\b)/i;
const GREETING_PATTERN =
    /^(?:\s)*(?:halo|hai|hi|hello|assalamu'?alaikum|selamat\s+(?:pagi|siang|sore|malam))(?:[!.?,\s]*)$/i;

export function resolveCustomerServiceFaq(
    body: string | undefined
): CustomerServiceFaqIntent | null {
    if (!body?.trim()) return null;

    const text = body.trim();

    if (PRICE_LIST_PATTERN.test(text)) return "price-list";
    if (ORDER_PATTERN.test(text)) return "how-to-order";
    if (SERVICE_PATTERN.test(text)) return "services";
    if (GREETING_PATTERN.test(text)) return "greeting";

    return null;
}

export function formatCustomerServiceFaq(
    intent: Exclude<CustomerServiceFaqIntent, "price-list">
): string {
    switch (intent) {
        case "how-to-order":
            return [
                "*CARA ORDER CREDO STORE*",
                "",
                "1. Buka katalog dan pilih layanan atau paket yang sesuai.",
                "2. Buka paket, lalu isi detail pesanan yang diminta.",
                "3. Periksa ringkasan pesanan.",
                "4. Lanjutkan percakapan melalui WhatsApp untuk konfirmasi dengan toko.",
                "",
                "Katalog: https://credo-store.vercel.app/paket",
            ].join("\n");

        case "services":
            return [
                "*LAYANAN CREDO STORE*",
                "",
                "Credo Store menyediakan layanan Mobile Legends. Katalog mencakup layanan per-star, paket harga tetap, dan tier progression jika tersedia.",
                "Ketik *harga* untuk melihat paket dan harga yang sedang aktif.",
            ].join("\n");

        case "greeting":
            return [
                "Ada yang bisa Credo Store bantu?",
                "",
                "• Ketik *harga* untuk melihat daftar paket.",
                "• Ketik *cara order* untuk panduan pemesanan.",
                "• Ketik *layanan* untuk mengetahui jenis layanan.",
            ].join("\n");
    }
}

export function formatCustomerServiceWelcome(): string {
    return [
        "*Halo! Selamat datang di Credo Store.*",
        "",
        "Gw asisten otomatis Credo Store untuk membantu informasi layanan Mobile Legends.",
        "Ketik salah satu kata kunci berikut:",
        "• *harga* — daftar paket dan harga aktif",
        "• *cara order* — panduan pemesanan",
        "• *layanan* — jenis layanan yang tersedia",
        "",
        "Untuk pertanyaan di luar informasi tersebut, admin perlu memberikan konfirmasi.",
    ].join("\n");
}
