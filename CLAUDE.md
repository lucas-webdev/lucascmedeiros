# CLAUDE.md

## Project Overview

Personal website and portfolio for **Lucas Cardoso Medeiros**, Senior Frontend Engineer with 8+ years of experience. The site is a **strategic career tool** designed to land remote USD-paying roles from US/Canadian companies.

- **Repository:** https://github.com/lucas-webdev/lucascmedeiros
- **Live site:** https://lucascmedeiros.com.br
- **Owner:** Lucas Medeiros (lucascmedeiros.dev@gmail.com)
- **Location:** Belo Horizonte, MG, Brazil
- **Languages:** Portuguese (Native), English (C1), French (B1)

---

## Tech Stack

- **Next.js 16** (App Router) with static export (`output: 'export'`)
- **React 19**
- **TypeScript 5.9** (strict mode)
- **Tailwind CSS v4** (CSS-based config, no `tailwind.config.ts`)
- **Framer Motion** for subtle animations
- **next-intl v4** for i18n (en / pt)
- **ESLint 9** (flat config, Next.js core-web-vitals)
- **Package manager:** npm

---

## i18n Architecture (Critical)

The site is fully bilingual: **English** and **Portuguese**.

### How It Works
- **next-intl** with App Router — locale stored in URL path prefix (`/en/...`, `/pt/...`)
- Default locale: `en` (target audience is US companies)
- Root `/` page detects browser language client-side and redirects to `/en/` or `/pt/`
- All locale routes are pre-rendered at build time via `generateStaticParams`
- All UI strings live in `messages/en.json` and `messages/pt.json` — never hardcode strings
- Since static export doesn't support edge middleware, locale detection is client-side only

### Static Export + next-intl Pattern
Every async page/layout **must** call `setRequestLocale(locale)` before any `useTranslations`. Without this, the build fails with "couldn't be rendered statically because it used headers()".

```tsx
// Pattern: async page → setRequestLocale → sync child with useTranslations
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageContent />;
}
```

### Routes
All routes use **English paths** for both locales. Localized Portuguese paths (e.g., `/pt/sobre`) are not used — next-intl pathname rewriting requires middleware, which isn't available with static export.

| Page | EN | PT |
|------|-----|-----|
| Home | `/en` | `/pt` |
| About | `/en/about` | `/pt/about` |
| Projects | `/en/projects` | `/pt/projects` |
| Blog | `/en/blog` | `/pt/blog` |
| Resume | `/en/resume` | `/pt/resume` |
| Contact | `/en/contact` | `/pt/contact` |

---

## Candidate Profile (Brief)

**Lucas Cardoso Medeiros** — Senior Frontend Engineer, 8+ years. Specializes in performance optimization (40-70% improvements), design systems (20+ components), testing infrastructure (0 to 90% coverage), and legacy migrations (Vue to React). Key employers: Refersion, IPSEMG/PRODEMGE, CGI, Emma, Mindera, Inter, Rock Content, Dito CRM. Bachelor's in Computer Engineering (CEFET-MG, 2015).

Full career details, skills, and timeline content are in `messages/en.json` and `messages/pt.json`.

---

## Project Structure

```
lucascmedeiros/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (minimal wrapper)
│   │   ├── page.tsx                # Root redirect (browser lang detection)
│   │   ├── globals.css             # Tailwind v4 imports + theme variables
│   │   └── [locale]/
│   │       ├── layout.tsx          # Locale layout (next-intl provider, Header, Footer)
│   │       ├── page.tsx            # Home (Hero, Highlights, Featured Projects, CTA)
│   │       ├── about/page.tsx      # About (bio, skills, timeline, values)
│   │       ├── projects/page.tsx   # Projects (placeholder)
│   │       ├── blog/page.tsx       # Blog (placeholder)
│   │       ├── resume/page.tsx     # Resume (placeholder)
│   │       └── contact/page.tsx    # Contact (placeholder)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx          # Sticky header, nav, locale switcher, dark mode toggle, mobile menu
│   │   │   └── footer.tsx          # Footer with social links
│   │   ├── sections/
│   │   │   ├── hero.tsx            # Home hero with CTAs and Framer Motion
│   │   │   ├── highlights.tsx      # Stats grid (experience, performance, testing, components)
│   │   │   ├── cta.tsx             # Contact call-to-action
│   │   │   ├── skills-grid.tsx     # 5 skill category cards
│   │   │   ├── timeline.tsx        # 8 career entries with visual timeline
│   │   │   └── values-grid.tsx     # 4 value cards
│   │   └── theme-provider.tsx      # Dark mode (localStorage + system preference)
│   ├── i18n/
│   │   ├── routing.ts             # Locale config + pathname mappings
│   │   ├── request.ts             # next-intl request config
│   │   └── navigation.ts          # Locale-aware Link, useRouter, etc.
│   └── lib/
│       └── utils.ts               # cn() utility (clsx + tailwind-merge)
├── messages/
│   ├── en.json                    # English translations (complete)
│   └── pt.json                    # Portuguese translations (complete)
├── public/                        # Static assets (currently empty)
├── .github/workflows/deploy.yml   # Build + FTPS deploy on push to main
├── CLAUDE.md
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## Key Technical Details

### Tailwind CSS v4
- CSS-based config: `@import "tailwindcss"` + `@theme {}` in `globals.css`
- PostCSS plugin: `@tailwindcss/postcss`
- No `tailwind.config.ts` file
- Dark mode via `.dark` class on `<html>`

### Theme / Dark Mode
- `ThemeProvider` uses React Context + localStorage + `prefers-color-scheme` fallback
- Must NOT render `<html>/<body>` tags — layout already provides these
- Toggled via button in Header

### next-intl in Layouts
- Use `getMessages()` from `next-intl/server` in async layouts, NOT `useMessages()` hook
- `NextIntlClientProvider` wraps content in the locale layout

### Static Export Limitations
These Next.js features are **NOT available**:
- Server-side rendering (SSR)
- API routes (`/api/*`)
- Edge middleware
- `next/image` optimization (uses `unoptimized: true`)
- Incremental Static Regeneration (ISR)

---

## Pages Status

### Implemented
- **Home** — Hero (availability dot, greeting, name, title, CTAs), Highlights (4 stat cards), Featured Projects (skeleton placeholder), CTA section
- **About** — Bio (4 paragraphs), Skills grid (5 categories), Timeline (8 career entries with Framer Motion), Values grid (4 cards)

### Placeholder ("Coming soon")
- **Projects** — Needs 3-5 featured projects, project detail pages (MDX)
- **Blog** — Needs MDX infrastructure, blog posts, listing page
- **Resume** — Needs web version of resume + PDF download (EN and PT)
- **Contact** — Needs form with spam protection

---

## Development Phases

### Phase 1: Foundation (MVP) — COMPLETE
- [x] Next.js project with TypeScript strict mode
- [x] Tailwind CSS v4
- [x] next-intl (routing, message files, locale detection)
- [x] Layout components (Header with locale switcher + mobile menu, Footer)
- [x] Home page (Hero, Highlights, CTA) — both locales
- [x] About page (bio, skills, timeline, values) — both locales
- [x] Dark mode toggle
- [x] Static export configured
- [x] GitHub Actions FTPS deploy workflow
- [x] Site deployed and live

### Phase 2: Portfolio & Resume
- [ ] Projects page with 3-5 featured projects
- [ ] Project detail pages (MDX)
- [ ] Resume page (web version) — EN and PT
- [ ] PDF download for resume (both languages)
- [ ] Mobile responsive polish

### Phase 3: Content & Blog
- [ ] MDX blog infrastructure
- [ ] First 2-3 blog posts
- [ ] Blog listing page with locale filter
- [ ] RSS feed (per locale)

### Phase 4: Polish & SEO
- [ ] Contact form with spam protection
- [ ] Analytics (Plausible or similar)
- [ ] Full accessibility audit
- [ ] Performance optimization pass
- [ ] SEO: structured data, sitemaps, OG images, robots.txt
- [ ] Custom 404 page

### Phase 5: Interactive Projects (post-launch)
- [ ] Mini-project: React Performance Profiler
- [ ] Mini-project: Design Token Generator
- [ ] Mini-project: Remote Team Timezone Coordinator

### Future Pages
- `/now` — Current focus, availability
- `/uses` — Dev setup, tools

---

## Deployment

- **Build:** `npm run build` generates a static `out/` directory
- **Deploy:** GitHub Actions on push to `main` → builds → uploads via lftp (FTPS) to hosting
- **Host:** lucascmedeiros.com.br via FTPS (`ftp.lucascmedeiros.com.br`)
- **Remote directory:** `/httpdocs/`
- **Mode:** Clean deploy (deletes remote files before uploading, 3 parallel connections)
- **Workflow:** `.github/workflows/deploy.yml`

### GitHub Secrets (Configured)

| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | `ftp.lucascmedeiros.com.br` |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (static export to out/)
npm run start        # Start production server locally
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check without building
```

---

## Coding Standards

- TypeScript strict mode — no `any`, no implicit returns
- ESLint with Next.js core-web-vitals preset
- Prefer named exports over default exports (except pages)
- Components: PascalCase files, colocate styles/tests
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- Server Components by default, `"use client"` only when required
- Keep components small and composable
- All text content must go through i18n — never hardcode strings in components

---

## Design Guidelines

### Visual Identity
- Dark mode support with light/dark color tokens in CSS
- Typography: Inter (sans) + monospace fallback
- Generous whitespace, clean visual hierarchy
- Professional but human tone — not corporate

### Interaction Design
- Sticky header with blur backdrop
- Locale switcher (en/pt toggle) in header
- Framer Motion for page transitions and scroll-triggered reveals (keep it subtle)
- Responsive: mobile-first with hamburger menu

### Accessibility
- WCAG 2.1 Level AA target
- Semantic HTML with proper heading hierarchy
- Keyboard navigation for all interactive elements
- Focus indicators on all interactive elements
- Color contrast ratio 4.5:1 minimum

---

## SEO Strategy

### Implemented
- `hreflang` alternate links in locale layout metadata
- Open Graph meta tags per page per locale
- Semantic HTML structure

### TODO
- Per-locale `sitemap.xml` generation
- `robots.txt`
- JSON-LD structured data (`Person`, `WebSite`, `BlogPosting`)
- Dynamic OG images (Next.js `ImageResponse`)

### Target Keywords
- EN: "senior frontend engineer", "React developer", "TypeScript expert", "remote software engineer"
- PT: "engenheiro frontend senior", "desenvolvedor React", "especialista TypeScript"

---

## Content Guidelines

- **English content** targets US hiring managers and recruiters
- **Portuguese content** targets Brazilian tech community and local opportunities
- Tone: Professional but approachable, senior-level confidence without arrogance
- Focus: ownership, impact, decision-making, real metrics
- Resume content should stay in sync with PDF versions

---

## Key Links

- **GitHub:** https://github.com/lucas-webdev
- **LinkedIn:** https://www.linkedin.com/in/lucascmedeiros/
- **Email:** lucascmedeiros.dev@gmail.com
- **Live site:** https://lucascmedeiros.com.br
- **Resume (EN):** `C:\Users\Lucas\Documents\Pessoais\CV\Lucas_Medeiros_cv_en.pdf`
- **Resume (PT):** `C:\Users\Lucas\Documents\Pessoais\CV\Lucas_Medeiros_CV_PT.pdf`
