# PR-05 — Customer-service dashboard management

## Scope

This PR adds owner-managed customer-service settings and deterministic FAQ entries to the existing Svelte/Fastify dashboard.

- Enable or disable private-chat customer-service automation.
- Configure the first-contact welcome message.
- Create, edit, enable/disable, and delete custom FAQ entries.
- Match FAQ entries using normalized keyword phrases.
- Keep dashboard writes owner-only; owner and team accounts can read settings and FAQs.
- Keep custom FAQ data separate from the bot's existing User/Admin models.

## Catalog ownership

Credo Store remains the source of truth for products, packages, availability, and prices. CredoBOT continues to fetch the public catalog API. This PR intentionally does not duplicate catalog records or allow dashboard FAQ entries to override price-list requests.

## Runtime behavior

- Customer-service automation remains restricted to eligible private chats.
- If customer-service automation is disabled, the customer-service handler declines the message and the existing message pipeline continues.
- Built-in price-list intent is evaluated before custom FAQ matching, so a custom keyword cannot replace live catalog prices.
- Custom FAQ matching is deterministic: case-insensitive substring matching, in persisted creation order.
- If settings cannot be loaded, the handler preserves the existing built-in behavior instead of using partially loaded custom data.
- Existing group welcome/leave handling is untouched.

## Persistence

New MongoDB Prisma models:
- `CustomerServiceSettings`: singleton document with enabled state and optional welcome text.
- `CustomerServiceFaqEntry`: title, keywords, response, enabled state, and timestamps.

After pulling this PR locally, run:

```bash
npx prisma generate
npx prisma db push
npm run test:customer-service
npm run web:build
```

The schema push creates the new collections. Existing `CustomerConversation` data and group settings are not repurposed.

## Security and validation

- Dashboard routes verify the existing signed dashboard session.
- Read access is limited to owner/team roles; mutations are owner-only.
- FAQ title/response lengths and keyword count/length are bounded.
- FAQ IDs are validated as MongoDB ObjectIds before update/delete.
- No secrets or catalog prices are stored in this dashboard feature.

## Validation status

Source changes and focused unit tests are included. A successful build, Prisma generation, schema push, and live dashboard/WhatsApp smoke test must be confirmed locally before merging.
