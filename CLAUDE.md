# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio site for Lucas Cardoso Medeiros, Senior Frontend Engineer. Single-page layout with anchor navigation, fully bilingual (EN/PT), statically exported.

- **Live site:** https://lucascmedeiros.com.br
- **Stack:** Next.js 16 (App Router, static export), React 19, TypeScript 5.9 strict, Tailwind CSS v4, Framer Motion, next-intl v4
- **Package manager:** npm

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Static export to out/
npm run lint         # ESLint (next/core-web-vitals)
npx tsc --noEmit     # Type-check only
```

There are no tests configured in this project.

## Architecture

### Single-page with Anchor Navigation

All sections render on `/en` or `/pt`. The root `/` page detects browser language client-side and redirects. Sections in order: Hero, About, Skills, Experience, Projects, Open Source, Testimonials, Contact. Header scroll-spy tracks all except Open Source.

### i18n (Critical — Build-Breaking Pattern)

Uses **next-intl** with locale in URL path prefix (`/en/...`, `/pt/...`). All UI strings live in `messages/en.json` and `messages/pt.json` — **never hardcode strings**.

Every async page/layout **must** call `setRequestLocale(locale)` before any `useTranslations`. Without this, the build fails with *"couldn't be rendered statically because it used headers()"*.

```tsx
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);  // REQUIRED before useTranslations
  return <PageContent />;
}
```

In async layouts, use `getMessages()` from `next-intl/server`, NOT `useMessages()` hook.

When adding new text content: add keys to **both** `messages/en.json` and `messages/pt.json`, then use `useTranslations('namespace')` in components.

### Static Export Constraints

`output: 'export'` in next.config.ts means these features are **unavailable**:
- SSR, API routes, Edge middleware, ISR
- `next/image` optimization (uses `unoptimized: true`)
- Locale detection is client-side only (no middleware)

### Tailwind CSS v4

CSS-based config — there is **no `tailwind.config.ts`** file. Theme tokens are defined in `src/app/globals.css` using `@theme {}` blocks. Dark mode uses `.dark` class on `<html>`, configured via `@custom-variant dark`.

### Dark Mode

`ThemeProvider` (`src/components/theme-provider.tsx`) uses React Context + localStorage + `prefers-color-scheme` fallback. It must NOT render `<html>/<body>` tags — the root layout already provides these.

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Navigation

Use locale-aware `Link`, `useRouter`, `usePathname` from `@/i18n/navigation` (not from `next/link` or `next/navigation` directly).

## Coding Standards

- TypeScript strict mode — no `any`, no implicit returns
- Prefer named exports (except page/layout defaults)
- Server Components by default, `"use client"` only when needed
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional classes
- All text via i18n — never hardcode user-facing strings

## Deployment

Automated via GitHub Actions (`.github/workflows/deploy.yml`). Push to `main` triggers the pipeline:

1. `npm ci` → `npm run build` (Node 20, static export to `out/`)
2. `lftp` mirrors `out/` to `/httpdocs/` on the hosting server via FTPS (clean deploy — deletes remote files first, 3 parallel connections)

**Host:** lucascmedeiros.com.br via FTPS (`ftp.lucascmedeiros.com.br`)

**Required GitHub Secrets:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`

The deploy is a destructive mirror — everything in `/httpdocs/` is replaced with the contents of `out/`. There is no rollback mechanism; revert by pushing a fix to `main`.
