# PR-01 — CredoBOT Architecture Audit

## Status

This document records the baseline audit and the architectural boundaries for adapting the ChisatoBOT fork into CredoBOT for Mobile Legends boosting customer support.

- Repository: `Fatih918/CredoBOT`
- Audited baseline: `main` at `598bade91bef28a47572e430ea777f2ce16e30db`
- Scope: documentation and architecture decisions only
- Runtime behavior: unchanged by this PR

## Product scope

CredoBOT serves two distinct WhatsApp contexts:

1. **Private customer conversations** for Credo-Store: greeting, service and price-list responses, FAQs, order-intent capture, and escalation to a human admin.
2. **WhatsApp groups**: retain the existing ChisatoBOT group features, especially participant welcome/leave notifications and group-management commands.

These contexts must remain isolated. Customer-service automation must not replace, disable, or reinterpret group participant events.

## Existing architecture (audited)

### WhatsApp event entry points

The current startup flow in `src/auth/connect.ts`:

- Creates the Baileys-backed `Client`.
- Registers `messages.upsert`, serializes the incoming message, and delegates to `MessageHandler.handle`.
- Registers `group-participants.update` and delegates to `GroupUpdateHandler.handleParticipantsUpdate`.
- Registers `group.update` and delegates to `GroupUpdateHandler.handle`.
- Also registers call and message-revoke handlers.

### Message handling

`src/modules/handlers/message/message-handler.ts` builds a message context and currently handles dashboard login OTP, command lookup/validation/execution, dashboard admin sessions, AFK behavior, and group settings. This is the correct integration boundary for a future private-chat customer-service handler, but the new handler must run only for eligible incoming private messages.

### Existing group welcome/leave behavior

The group welcome implementation is already present:

- `prisma/schema.prisma` defines per-group `Settings.welcome`, `welcomeMessage`, `leave`, `leaveMessage`, `welcomeConfig`, and `leaveConfig`.
- `src/auth/connect.ts` routes participant changes to `GroupUpdateHandler.handleParticipantsUpdate`.
- `src/modules/handlers/group/group-update.handler.ts` handles add/remove participant events and checks the per-group welcome/leave settings.
- Welcome supports custom placeholders (`@user`, `@group`, `@ownergroup`), generated welcome images, mention handling, startup-backlog suppression, send pacing, media rate limits, and text fallback.
- Group welcome/leave and group-management commands remain existing product functionality. PRs for customer service must not remove or repurpose them.

### Current persistence

The Prisma MongoDB schema currently contains `Group`, `User`, `Session`, `Admin`, `DashboardConfig`, and `GroupAuditLog`.

The existing `User` model represents bot users and contains bot-specific limit, premium, AFK, level, and command statistics. It is not a customer CRM model. The existing `Admin` model stores dashboard login credentials; it is not a WhatsApp handover routing configuration.

There are currently no dedicated catalog, product-price, customer-conversation, or business-FAQ models.

### Configuration and dashboard

- `config.json` is loaded by `ConfigService` from the process working directory.
- `.env.example` currently contains database, dashboard, JWT, proxy, OCR, and pairing-number variables.
- The existing Svelte/Fastify dashboard manages bot and group functionality. It does not yet expose Credo-Store catalog or customer-service management.

## Target architecture

Keep the existing group path intact and add a separate customer-service path to the message pipeline.

```text
WhatsApp events
|
+-- messages.upsert
|   |
|   +-- serialize.message
|       |
|       +-- MessageHandler
|           |
|           +-- existing OTP / command / admin-session handling
|           |
|           +-- CustomerServiceHandler (future)
|               |
|               +-- eligibility guard: incoming private chat only
|               +-- greeting / conversation state
|               +-- catalog and price lookup
|               +-- FAQ / deterministic keyword matching
|               +-- order-intent capture
|               +-- human-admin handover
|               +-- safe fallback when no answer is configured
|
+-- group-participants.update
|   |
|   +-- GroupUpdateHandler.handleParticipantsUpdate
|       +-- existing welcome / leave / anti-bot behavior (preserved)
|
+-- group.update
    |
    +-- GroupUpdateHandler.handle
        +-- existing group metadata notifications (preserved)
```

## Architectural decisions

### D1 — Separate customer domain from bot-user domain

Future customer records and conversations must use dedicated customer-service models. Do not overload the existing `User` model, which is coupled to bot limits, premium, AFK, and leveling.

### D2 — Private-chat-only automation

The customer-service handler must reject messages when any of these are true:

- The message is from the bot itself (`fromMe`).
- The message is a group message (`isGroup` or a group JID).
- The message is a status/broadcast, protocol, or unsupported event.
- The message is a bot command already handled by the command system.
- The message is an active dashboard login OTP or is consumed by an existing admin session.

The group event handlers remain separate and unchanged.

### D3 — Deterministic price answers

Price replies must be rendered from active catalog records only. The bot must never infer or invent a price. If the requested package is missing, inactive, ambiguous, or has no valid price, the bot must say it cannot confirm the price and offer human-admin assistance.

### D4 — Human handover is explicit

The handover recipient list must be configured explicitly for WhatsApp (initially via dedicated business settings/configuration). Do not assume dashboard `Admin` login records are valid WhatsApp recipients.

### D5 — No generative AI in the first release

Start with configured greetings, deterministic catalog lookup, and FAQ/keyword rules. This reduces operating cost and prevents fabricated prices or service terms. AI can be evaluated separately after the deterministic flow is measurable.

### D6 — Group welcome remains independently configurable

Group welcome/leave settings remain per-group and retain their current behavior. Customer greeting configuration must be separate from `Group.settings.welcomeMessage`.

## Planned delivery sequence

1. **PR-01 — Architecture audit (this PR):** document current event paths, data boundaries, constraints, and acceptance rules.
2. **PR-02 — Customer-service foundation:** add a private-chat eligibility guard and isolated handler with focused tests; do not add price data yet.
3. **PR-03 — Credo-Store catalog:** add catalog persistence and deterministic price-list rendering.
4. **PR-04 — FAQ and greeting:** add configurable first-contact greeting, FAQ matching, and safe unknown-intent fallback.
5. **PR-05 — Dashboard management:** manage business settings, catalog entries, and FAQ entries from the dashboard.
6. **PR-06 — Customer history:** persist customer identity and conversation/order-intent history with retention considerations.
7. **PR-07 — Human handover and business hours:** route to configured WhatsApp admins and support working-hours behavior.
8. **PR-08 — Operational controls:** add rate limiting, deduplication, opt-out/blacklist, and basic analytics before considering broadcast.
9. **PR-09 — Deployment hardening:** process supervision, session recovery, backups, monitoring, and operational documentation.

## Baseline risks and follow-up work

- No test files or test script are present in the audited tree.
- No lint script is declared in `package.json`.
- The only existing GitHub Actions workflow is dependency review; there is no application build/test CI workflow.
- No npm/pnpm/yarn lockfile is present in the audited tree. Reproducible dependency installation should be addressed before relying on CI build results.
- The package metadata and README still contain upstream ChisatoBOT identity/repository references. A separate cleanup should preserve upstream attribution and the GPL-3.0-only license.
- The repository has not been built or run as part of this documentation audit. GitHub source inspection is not a substitute for local dependency installation, build, or WhatsApp integration testing.

## Acceptance criteria for PR-01

- [x] Current WhatsApp event entry points are documented.
- [x] Existing group welcome/leave implementation and persistence are documented.
- [x] Customer-service and group-bot responsibilities are explicitly separated.
- [x] Existing bot-user/admin models are not repurposed as customer CRM/handover models.
- [x] Price accuracy and human fallback rules are documented.
- [x] No runtime behavior or existing group functionality is changed.
