/**
 * Pure eligibility guard for the Credo-Store private-chat customer-service flow.
 *
 * Keep this independent from Baileys and database types so it can be tested
 * without connecting to WhatsApp or MongoDB.
 */
export interface CustomerServiceMessageLike {
    from?: string | null;
    fromMe?: boolean | null;
    isGroup?: boolean | null;
    type?: string | null;
}

const DIRECT_CHAT_SUFFIXES = [
    "@s.whatsapp.net",
    "@lid",
    "@hosted.lid",
] as const;

const NON_CONVERSATION_TYPES = new Set([
    "protocolMessage",
    "reactionMessage",
    "pollUpdateMessage",
    "senderKeyDistributionMessage",
]);

/**
 * Returns true only for an incoming, one-to-one WhatsApp conversation.
 *
 * Fail closed when the serializer has not supplied enough information. Group,
 * status, broadcast, newsletter, bot-originated, and protocol events must
 * never enter the customer-service flow.
 */
export function isEligibleForCustomerService(
    message: CustomerServiceMessageLike
): boolean {
    if (!message || message.fromMe !== false || message.isGroup !== false) {
        return false;
    }

    const jid = message.from?.trim().toLowerCase();
    if (!jid || jid === "status@broadcast") {
        return false;
    }

    if (
        jid.endsWith("@g.us") ||
        jid.endsWith("@broadcast") ||
        jid.endsWith("@newsletter")
    ) {
        return false;
    }

    if (!DIRECT_CHAT_SUFFIXES.some((suffix) => jid.endsWith(suffix))) {
        return false;
    }

    if (!message.type || NON_CONVERSATION_TYPES.has(message.type)) {
        return false;
    }

    return true;
}
