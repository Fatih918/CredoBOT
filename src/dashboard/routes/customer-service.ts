import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Database } from "../../libs/database/prisma";
import { verifyToken } from "./auth";

function authorize(request: FastifyRequest, reply: FastifyReply, ownerOnly = false): boolean {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        reply.status(401).send({ success: false, message: "Unauthorized" });
        return false;
    }
    const user = verifyToken(header.slice(7));
    if (!user || (user.role !== "owner" && user.role !== "team")) {
        reply.status(403).send({ success: false, message: "Forbidden" });
        return false;
    }
    if (ownerOnly && user.role !== "owner") {
        reply.status(403).send({ success: false, message: "Owner only" });
        return false;
    }
    return true;
}

function normalizeKeywords(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0 && item.length <= 60))].slice(0, 20);
}

async function ensureSettings() {
    return Database.customerServiceSettings.upsert({
        where: { key: "default" },
        create: { key: "default", enabled: true },
        update: {},
    });
}

export async function customerServiceRoutes(fastify: FastifyInstance) {
    fastify.get("/settings", async (request, reply) => {
        if (!authorize(request, reply)) return;
        try {
            const settings = await ensureSettings();
            return { success: true, settings };
        } catch {
            return reply.status(500).send({ success: false, message: "Failed to load customer-service settings" });
        }
    });

    fastify.patch("/settings", async (request: FastifyRequest<{ Body: any }>, reply) => {
        if (!authorize(request, reply, true)) return;
        const body = (request.body ?? {}) as Record<string, unknown>;
        const data: { enabled?: boolean; welcomeMessage?: string | null } = {};
        if (typeof body.enabled === "boolean") data.enabled = body.enabled;
        if (typeof body.welcomeMessage === "string") {
            const message = body.welcomeMessage.trim();
            if (message.length > 1500) return reply.status(400).send({ success: false, message: "Welcome message must be 1500 characters or less" });
            data.welcomeMessage = message || null;
        }
        if (Object.keys(data).length === 0) return reply.status(400).send({ success: false, message: "No valid settings supplied" });
        try {
            const settings = await Database.customerServiceSettings.upsert({
                where: { key: "default" },
                create: { key: "default", enabled: data.enabled ?? true, welcomeMessage: data.welcomeMessage ?? null },
                update: data,
            });
            return { success: true, settings };
        } catch {
            return reply.status(500).send({ success: false, message: "Failed to save customer-service settings" });
        }
    });

    fastify.get("/faqs", async (request, reply) => {
        if (!authorize(request, reply)) return;
        try {
            const faqs = await Database.customerServiceFaqEntry.findMany({ orderBy: { createdAt: "desc" } });
            return { success: true, faqs };
        } catch {
            return reply.status(500).send({ success: false, message: "Failed to load FAQ entries" });
        }
    });

    fastify.post("/faqs", async (request: FastifyRequest<{ Body: any }>, reply) => {
        if (!authorize(request, reply, true)) return;
        const body = (request.body ?? {}) as Record<string, unknown>;
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const response = typeof body.response === "string" ? body.response.trim() : "";
        const keywords = normalizeKeywords(body.keywords);
        if (!title || title.length > 100 || !response || response.length > 1500 || keywords.length === 0) {
            return reply.status(400).send({ success: false, message: "Title (max 100), response (max 1500), and at least one keyword are required" });
        }
        try {
            const faq = await Database.customerServiceFaqEntry.create({
                data: { title, response, keywords, enabled: body.enabled !== false },
            });
            return reply.status(201).send({ success: true, faq });
        } catch {
            return reply.status(500).send({ success: false, message: "Failed to create FAQ entry" });
        }
    });

    fastify.patch("/faqs/:id", async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
        if (!authorize(request, reply, true)) return;
        const { id } = request.params;
        if (!/^[a-f0-9]{24}$/i.test(id)) return reply.status(400).send({ success: false, message: "Invalid FAQ id" });
        const body = (request.body ?? {}) as Record<string, unknown>;
        const data: { title?: string; response?: string; keywords?: string[]; enabled?: boolean } = {};
        if (typeof body.title === "string") {
            const title = body.title.trim();
            if (!title || title.length > 100) return reply.status(400).send({ success: false, message: "Invalid FAQ title" });
            data.title = title;
        }
        if (typeof body.response === "string") {
            const response = body.response.trim();
            if (!response || response.length > 1500) return reply.status(400).send({ success: false, message: "Invalid FAQ response" });
            data.response = response;
        }
        if (body.keywords !== undefined) {
            const keywords = normalizeKeywords(body.keywords);
            if (keywords.length === 0) return reply.status(400).send({ success: false, message: "At least one keyword is required" });
            data.keywords = keywords;
        }
        if (typeof body.enabled === "boolean") data.enabled = body.enabled;
        if (Object.keys(data).length === 0) return reply.status(400).send({ success: false, message: "No valid fields supplied" });
        try {
            const faq = await Database.customerServiceFaqEntry.update({ where: { id }, data });
            return { success: true, faq };
        } catch {
            return reply.status(404).send({ success: false, message: "FAQ entry not found" });
        }
    });

    fastify.delete("/faqs/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
        if (!authorize(request, reply, true)) return;
        const { id } = request.params;
        if (!/^[a-f0-9]{24}$/i.test(id)) return reply.status(400).send({ success: false, message: "Invalid FAQ id" });
        try {
            await Database.customerServiceFaqEntry.delete({ where: { id } });
            return { success: true };
        } catch {
            return reply.status(404).send({ success: false, message: "FAQ entry not found" });
        }
    });
}
