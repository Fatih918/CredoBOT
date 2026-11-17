import type { Client } from "../../../libs/client/client";
import type { MessageSerialize } from "../../../types/structure/serialize";
import {
    isEligibleForCustomerService,
} from "./customer-service-eligibility";
import { getPublicCatalog } from "./catalog-client";
import { formatPriceList } from "./price-list.formatter";
import {
    formatCustomerServiceFaq,
    formatCustomerServiceWelcome,
    resolveCustomerServiceFaq,
} from "./customer-service-faq";
import { registerCustomerContact } from "./customer-conversation.service";

function withWelcome(response: string, isFirstContact: boolean): string {
    return isFirstContact
        ? `${formatCustomerServiceWelcome()}\n\n━━━━━━━━━━━━━━\n\n${response}`
        : response;
}

/**
 * Deterministic Credo-Store automation for eligible private chats only.
 * Unknown questions are not guessed; they continue through the existing
 * message pipeline until a dedicated human-handover flow is implemented.
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
            context?.cmd
        ) {
            return false;
        }

        let isFirstContact = false;

        try {
            isFirstContact = await registerCustomerContact(message.from);
        } catch {
            // Customer-service replies must remain available if first-contact
            // persistence is temporarily unavailable. Greeting is skipped.
        }

        const intent = resolveCustomerServiceFaq(message.body);

        if (intent === "price-list") {
            let response: string;

            try {
                const catalog = await getPublicCatalog();
                response = formatPriceList(catalog);
            } catch {
                // Never fall back to old/static prices when the live catalog is down.
                response =
                    "Maaf, daftar harga Credo Store sedang tidak bisa diakses. Aku belum bisa memastikan harga terbaru. Silakan hubungi admin Credo Store untuk konfirmasi.";
            }

            await Chisato.sendText(
                context.from,
                withWelcome(response, isFirstContact),
                message
            );
            return true;
        }

        if (intent) {
            const response =
                intent === "greeting" && isFirstContact
                    ? formatCustomerServiceWelcome()
                    : formatCustomerServiceFaq(intent);

            await Chisato.sendText(
                context.from,
                withWelcome(response, isFirstContact && intent !== "greeting"),
                message
            );
            return true;
        }

        if (isFirstContact) {
            await Chisato.sendText(
                context.from,
                formatCustomerServiceWelcome(),
                message
            );
            return true;
        }

        return false;
    }
}
