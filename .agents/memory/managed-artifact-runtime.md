---
name: Managed artifact runtime
description: Replit-specific runtime requirements for this imported pnpm artifact workspace.
---

The registered artifact workflows are the source of truth for running the imported web and API services. They inject the runtime `PORT` and `BASE_PATH` values required by the existing Vite and Express entry points.

**Why:** Running the same Vite build command directly without those environment values fails before compilation, even when the managed preview workflow is healthy.

**How to apply:** Use the exact managed workflow for preview verification; only run one-off builds with explicit runtime values when a standalone build check is needed.