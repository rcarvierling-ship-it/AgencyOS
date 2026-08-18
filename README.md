# AgencyOS

AI-native operating system for a modern web agency.

## Vision

AgencyOS turns local-business prospecting into a complete business lifecycle:

**Discover → Qualify → Research → Demo → Outreach → Opportunity → Client → Build → Launch → Host**

Every discovered business gets a permanent Business Record. Leads, opportunities, demos, outreach, projects, websites, hosting, and future interactions attach to that record.

## Monorepo

- `apps/web` — public agency website
- `apps/admin` — AgencyOS command center
- `apps/demo` — prospect website-concept viewer
- `apps/portal` — future client portal
- `packages/db` — database schema and queries
- `packages/ui` — shared UI primitives
- `packages/core` — domain models and business logic
- `packages/ai` — AI/agent orchestration
- `packages/integrations` — external service adapters
- `agents/` — future specialized AI agents

## Initial stack

Next.js, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Zod, pnpm workspaces, Turborepo.

## Product rule

A **Business** is permanent. A **Lead/Opportunity** is temporary. A **Client** is a business that purchased. Never delete a business merely because an opportunity is lost.

## Deployment

Production is deployed from the `main` branch through Vercel.
