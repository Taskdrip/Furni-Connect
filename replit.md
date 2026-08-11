# BobTech Furnitures

BobTech Furnitures is a Nigerian furniture and interior-design marketplace that connects customers with trusted makers and professionals, with an AI-assisted room design flow.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/furniconnect/src/App.tsx` — customer-facing marketplace, AI room designer, dashboards, auth demo, and shared header/footer.
- `artifacts/furniconnect/src/index.css` — BobTech visual tokens, typography, responsive utilities, and motion.
- `artifacts/furniconnect/public/brand-logo.png` — supplied BobTech Furnitures logo used in the web app.
- `artifacts/api-server/src/routes/` — Express API routes.
- `lib/db/src/schema/` — Drizzle/PostgreSQL schema source of truth.
- `lib/api-spec/` — OpenAPI contract used to generate the client and Zod schemas.

## Architecture decisions

- The existing pnpm workspace and React/Vite + Express + Drizzle stack are retained to keep imported project conventions intact.
- The homepage hero uses local furniture imagery and a client-side accessible slider so the first impression remains fast and works without an external image service.
- The supplied BobTech logo is copied into the frontend public assets and is rendered by the shared brand component so header, footer, workspace, and auth surfaces stay consistent.

## Product

Customers can browse and filter Nigerian furniture and interior professionals, view provider profiles, upload a room photo, generate an AI design concept, turn a concept into a project, and monitor project summaries. Professionals have a business workspace with leads, revenue, pipeline, and focus views.

## User preferences

- Brand the web app as **BobTech Furnitures**.
- Use the supplied BobTech logo in the header and footer.
- Keep the visual language professional, sleek, warm, and grounded in the logo's brown and gold tones.
- Keep a feature-oriented hero slider on the homepage.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
