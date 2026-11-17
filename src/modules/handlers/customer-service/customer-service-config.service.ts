import { Database } from "../../../libs/database/prisma";

export type CustomerServiceRuntimeConfig = {
    enabled: boolean;
    welcomeMessage: string | null;
    faqs: Array<{ id: string; title: string; keywords: string[]; response: string }>;
};

let runtimeConfigCache: { value: CustomerServiceRuntimeConfig; expiresAt: number } | null = null;

export async function getCustomerServiceRuntimeConfig(): Promise<CustomerServiceRuntimeConfig> {
    if (runtimeConfigCache && runtimeConfigCache.expiresAt > Date.now()) return runtimeConfigCache.value;

    const [settings, faqs] = await Promise.all([
        Database.customerServiceSettings.findUnique({ where: { key: "default" } }),
        Database.customerServiceFaqEntry.findMany({
            where: { enabled: true },
            select: { id: true, title: true, keywords: true, response: true },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    const value = {
        enabled: settings?.enabled ?? true,
        welcomeMessage: settings?.welcomeMessage ?? null,
        faqs,
    };
    runtimeConfigCache = { value, expiresAt: Date.now() + 10_000 };
    return value;
}

export function resolveConfiguredFaq(
    body: string | undefined,
    faqs: CustomerServiceRuntimeConfig["faqs"]
): string | null {
    const normalized = body?.trim().toLowerCase();
    if (!normalized) return null;

    const match = faqs.find((faq) =>
        faq.keywords.some((keyword) => {
            const term = keyword.trim().toLowerCase();
            return term.length > 0 && normalized.includes(term);
        })
    );
    return match?.response ?? null;
}
