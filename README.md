# Rext AI dashboard

The web app of [Rext AI](https://rext.ai), at app.rext.ai: a marketer types a keyword, chooses a content type, a title and an outline, and gets an article written in their brand voice, then edits, schedules and publishes it. It also holds the workspaces and their members, brand voices and personas, the integrations, billing and the super admin.

- **The app:** Next.js 16 (App Router, Turbopack) and React 19, Tailwind CSS v4 with shadcn on Radix, TanStack Query and Zustand, react-hook-form with zod, next-auth 5, and Lexical for the editor.
- **Data:** none of its own. Everything comes from the backend ([rextaihq/rext-backend](https://github.com/rextaihq/rext-backend), FastAPI and LangGraph) over HTTP and server-sent events, so nothing past `/login` renders without it.

## Where to read next

- [`ARCHITECTURE.md`](ARCHITECTURE.md): the map of the code, covering the routes, the shell and page layouts, the data layer, the generation stream, styling and the traps.
- [`AGENTS.md`](AGENTS.md): the rules for working on this repository (branches, secrets, every command, the code conventions, the review checklist).
- [`BACKGROUND_CONTENT_GENERATION.md`](BACKGROUND_CONTENT_GENERATION.md): how a generation keeps running while the person uses the rest of the app.
- [`env.ts`](env.ts): every variable the code reads, with its check. `.env.example` and `.env.local.example` list the names.

## Quick start

Node 24 and pnpm 12. Start the backend first, as its README describes; `.env.example` points the dashboard at it on `http://127.0.0.1:2024`.

```bash
pnpm install --frozen-lockfile
cp .env.example .env && cp .env.local.example .env.local   # then fill in the values
pnpm dev                                                    # http://localhost:3000
```

Before a pull request, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` and `pnpm build` pass; `AGENTS.md` lists the rest.

## Branches and deploys

`staging` is the base branch. A merge into it deploys the staging app, and a push to `main` deploys app.rext.ai (`.github/workflows/ci_cd.yaml`, both on Vercel). Every change goes through a pull request into `staging`.

## License

Proprietary. Copyright © Revnix LLC, the company behind Rext AI. All rights reserved.

The repository is public, but it carries no open-source licence. The fonts in `app/fonts/` keep their own licence, the SIL Open Font License ([`public/fonts/licenses/`](public/fonts/licenses/)).
