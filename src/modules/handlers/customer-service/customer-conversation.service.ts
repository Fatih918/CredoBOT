import { Database } from "../../../libs/database/prisma";

/**
 * Records a private customer conversation without reusing the bot User model.
 * Returns true only for the first successfully persisted contact.
 */
export async function registerCustomerContact(
    whatsappJid: string
): Promise<boolean> {
    const jid = whatsappJid?.trim().toLowerCase();

    if (
        !jid ||
        (!jid.endsWith("@s.whatsapp.net") &&
            !jid.endsWith("@lid") &&
            !jid.endsWith("@hosted.lid"))
    ) {
        return false;
    }

    const existing = await Database.customerConversation.findUnique({
        where: { whatsappJid: jid },
        select: { id: true },
    });

    if (existing) return false;

    try {
        await Database.customerConversation.create({
            data: { whatsappJid: jid },
        });
        return true;
    } catch (error) {
        // A concurrent first message may win the unique-key race.
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return false;
        }

        throw error;
    }
}
