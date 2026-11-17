import type { Client } from "../../../libs/client/client";
import type { MessageSerialize } from "../../../types/structure/serialize";
import {
    isEligibleForCustomerService,
} from "./customer-service-eligibility";
import { getPublicCatalog } from "./catalog-client";
import { formatPriceList } from "./price-list.formatter";

const PRICE_LIST_INTENT =
    /(?:\b(?:harga|tarif)\b|\bprice\s*list\b|\bdaftar\s+harga\b|\blist\s+harga\b|\bpaket\s+harga\b)/i;

function isPriceListRequest(body: string | undefined): boolean {
    return Boolean(body && PRICE_LIST_INTENT.test(body.trim()));
}

/**
 * Credo-Store customer service is restricted to eligible private chats.
 * Group messages continue through the existing group handlers unchanged.
 */
export class CustomerServiceHandler {
    static async handle(
        Chisato: Client,
        message: MessageSerialize,
        context: any
    ): Promise<boolean> {
        if (
            !isEligibleForCustomerService(message) ||
            context?.isGroup ||
            context?.isCmd ||
            context?.cmd ||
            !isPriceListRequest(message.body)
        ) {
            return false;
        }

        try {
            const catalog = await getPublicCatalog();
            await Chisato.sendText(
                context.from,
                formatPriceList(catalog),
                message
            );
        } catch {
            // Never fall back to old/static prices when the live catalog is down.
            await Chisato.sendText(
                context.from,
                "Maaf, daftar harga Credo Store sedang tidak bisa diakses. Aku belum bisa memastikan harga terbaru. Silakan hubungi admin Credo Store untuk konfirmasi.",
                message
            );
        }

        return true;
    }
}
