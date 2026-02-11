# CLAUDE.md

## Project Overview

Personal website and portfolio for **Lucas Cardoso Medeiros**, Senior Frontend Engineer with 8+ years of experience. The site is a **strategic career tool** designed to land remote USD-paying roles from US/Canadian companies.

- **Repository:** https://github.com/lucas-webdev/lucascmedeiros
- **Owner:** Lucas Medeiros (lucascmedeiros.dev@gmail.com)
- **Location:** Belo Horizonte, MG, Brazil
- **Languages:** Portuguese (Native), English (C1), French (B1)
- **Domain:** lucascmedeiros.com.br (hosted via FTP, FTPS)

---

## Migration Context

This project is being **migrated from Create React App to Next.js 15 (App Router)**. The existing CRA app is a placeholder (spinning React logo + name). All meaningful development starts fresh with Next.js.

### Current State (Legacy — to be replaced)
- Create React App with TypeScript
- React 18, react-scripts 5.0.1
- Deployed to GitHub Pages via gh-pages + GitHub Actions
- Package manager: Yarn

### Target State
- **Next.js 15** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling
- **Framer Motion** for subtle animations
- **next-intl** for i18n (pt-BR / en-US)
- **MDX** for blog/writing content
- **Static export** (`output: 'export'`) for FTP-compatible deployment
- **Deployed via GitHub Actions → FTPS** to lucascmedeiros.com.br

---

## i18n Architecture (Critical)

The site MUST be fully bilingual: **English (en-US)** and **Portuguese (pt-BR)**.

### Routing Strategy
```
/en/          → English home
/pt/          → Portuguese home
/en/about     → English about
/pt/sobre     → Portuguese about
/en/projects  → English projects
/pt/projetos  → Portuguese projects
/en/blog      → English blog
/pt/blog      → Portuguese blog
/en/resume    → English resume
/pt/curriculo → Portuguese resume
```

### Implementation
- Use **next-intl** with App Router middleware
- Locale detection from browser `Accept-Language` header
- Default locale: `en` (target audience is US companies)
- Locale stored in URL path prefix (`/en/...`, `/pt/...`)
- All UI strings in JSON message files: `messages/en.json`, `messages/pt.json`
- Content (MDX blog posts) can be single-language or have per-locale variants
- Resume/CV content should mirror the PDF versions (EN and PT already exist)
- SEO: `hreflang` tags, locale-specific meta descriptions, separate sitemaps per locale

### Naming Conventions for Routes
| English | Portuguese | Path EN | Path PT |
|---------|-----------|---------|---------|
| Home | Inicio | `/en` | `/pt` |
| About | Sobre | `/en/about` | `/pt/sobre` |
| Projects | Projetos | `/en/projects` | `/pt/projetos` |
| Blog | Blog | `/en/blog` | `/pt/blog` |
| Resume | Curriculo | `/en/resume` | `/pt/curriculo` |
| Contact | Contato | `/en/contact` | `/pt/contato` |

---

## Candidate Profile (Content Source)

### Professional Summary
Senior Frontend Engineer with 8+ years building high-performance web applications for international companies (US, EU, LATAM). Specializes in:
- Performance optimization (40-70% improvements)
- Design systems (20+ Storybook components)
- Frontend architecture
- Testing infrastructure (0 → 90% coverage)
- Legacy system migration (Vue → React, 60% faster)
- Mentoring engineers while staying hands-on

### Key Career Highlights (for portfolio content)
1. **Refersion (Somewhere LLC)** — Rebuilt merchant experience for 600K+ orders/day affiliate platform, built AI-powered affiliate discovery, migrated legacy navigation to modern React
2. **IPSEMG/PRODEMG (Grupo Montreal)** — Led frontend for mission-critical healthcare platform (2,000+ companies), built testing from 0→80%, reduced bugs 70%
3. **CGI (Growin)** — Enterprise e-commerce testing strategy (0→90%), WebAuthn/TOTP auth, CI/CD optimization
4. **Emma (Avenue Code Portugal)** — Vue 2→React/Next.js migration (60% faster loads), built design system from scratch (20+ components)
5. **Mindera (Aubay Portugal)** — Performance optimization for 2,000+ store e-commerce (Lighthouse 30→78), bundle size reduced 60%, 95% test coverage
6. **Inter** — PIX payment integration, design system standards
7. **Rock Content** — Greenfield SaaS for 3 markets, component library
8. **Dito CRM** — Dashboards for 150M+ consumer CDP

### Skills for Skills Section
- **Core Frontend:** React, TypeScript, Next.js, Remix, Frontend Architecture
- **UI & Design Systems:** TailwindCSS, Material UI, Radix UI, Storybook, WCAG
- **State & Data:** Redux, Jotai, REST APIs, GraphQL
- **Testing:** React Testing Library, Jest, Vitest, Playwright
- **DevOps:** CI/CD, Docker, AWS, Lighthouse, Datadog, Sentry

### Education
- Bachelor's in Computer Engineering — CEFET-MG (2015)

### Certifications
- Toggl Hire React Certificate (2024)
- Microsoft Exam 480: HTML5/JS/CSS3 (2019)
- AI-Assisted Certified Professional — Compass.uol (2024)
- Scrum Fundamentals Certified — SCRUMstudy (2017)

### Publication
- "Developing an Accessible One-Switch Game for Motor Impaired Players" — SBGames 2015

---

## Site Structure

### Pages
1. **Home (`/`)** — Hero with positioning, featured projects, contact CTA
2. **About (`/about`)** — Bio, career timeline, skills breakdown, values
3. **Projects (`/projects`)** — Portfolio showcase + interactive mini-projects
4. **Blog (`/blog`)** — Technical blog posts (MDX)
5. **Resume (`/resume`)** — Web version + PDF download (both EN and PT)
6. **Contact (`/contact`)** — Simple form with spam protection

### Future Pages (post-MVP)
- Now page (`/now`) — Current focus, availability
- Uses page (`/uses`) — Dev setup, tools

---

## Technical Architecture

### Project Structure
```
lucascmedeiros/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Locale layout with next-intl provider
│   │   │   ├── page.tsx            # Home
│   │   │   ├── about/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx        # Projects list
│   │   │   │   └── [slug]/page.tsx # Project detail
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx        # Blog list
│   │   │   │   └── [slug]/page.tsx # Blog post
│   │   │   ├── resume/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── layout.tsx              # Root layout
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Reusable primitives (Button, Card, etc.)
│   │   ├── layout/                 # Header, Footer, Navigation
│   │   └── sections/               # Page-specific sections (Hero, Timeline, etc.)
│   ├── lib/
│   │   ├── utils.ts
│   │   └── mdx.ts                  # MDX processing utilities
│   └── i18n/
│       ├── request.ts              # next-intl request config
│       └── routing.ts              # Locale routing config
├── messages/
│   ├── en.json                     # English translations
│   └── pt.json                     # Portuguese translations
├── content/
│   ├── projects/                   # Project MDX files
│   │   ├── en/
│   │   └── pt/
│   └── writing/                    # Blog post MDX files
│       ├── en/
│       └── pt/
├── public/
│   ├── images/
│   ├── resume/
│   │   ├── Lucas_Medeiros_cv_en.pdf
│   │   └── Lucas_Medeiros_CV_PT.pdf
│   ├── favicon.ico
│   └── og-image.png
├── CLAUDE.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Key Technical Decisions
- **React Server Components by default** — client components only when needed (interactivity, hooks)
- **next-intl middleware** for locale detection and routing
- **Tailwind CSS v4** — utility-first, no separate config file needed (CSS-based config)
- **Framer Motion** — only for page transitions and scroll-triggered reveals, keep it subtle
- **MDX via @next/mdx or contentlayer alternative** — for blog posts and project case studies
- **No CMS** — content lives in the repo as MDX/JSON files
- **Static export** — `output: 'export'` in next.config.ts for FTP deployment
- **FTP deployment** — GitHub Actions builds and uploads to FTPS on push to `main`

### Performance Budget
- Lighthouse: 95+ all metrics
- FCP: < 1.2s
- TTI: < 3.5s
- CLS: < 0.1
- Bundle: minimize client JS, leverage RSC

### Accessibility
- WCAG 2.1 Level AA
- Semantic HTML (proper heading hierarchy)
- Keyboard navigation for all interactive elements
- Skip-to-content link
- Color contrast ratio 4.5:1 minimum
- Focus indicators on all interactive elements
- Screen reader tested

---

## Design Guidelines

### Visual Identity
- **Palette:** 2-3 primary colors, professional and clean. Dark mode support.
- **Typography:** System font stack or Inter/Geist (1-2 fonts max)
- **Spacing:** Generous whitespace, clear visual hierarchy
- **Imagery:** Code screenshots, diagrams — no stock photos
- **Tone:** Professional but human, not corporate

### Interaction Design
- Sticky header with locale switcher
- Subtle hover effects, smooth page transitions
- Skeleton loading for dynamic content
- Friendly 404 page

---

## SEO Strategy

### Technical SEO
- Semantic HTML with proper heading hierarchy
- `hreflang` alternate links for each locale
- Per-locale `sitemap.xml` generation
- `robots.txt`
- JSON-LD structured data: `Person`, `WebSite`, `BlogPosting`
- Open Graph + Twitter Card meta per page per locale
- Dynamic OG images (Next.js `ImageResponse`)

### Target Keywords
- EN: "senior frontend engineer", "React developer", "TypeScript expert", "remote software engineer"
- PT: "engenheiro frontend sênior", "desenvolvedor React", "especialista TypeScript"

---

## Development Phases

### Phase 1: Foundation (MVP)
- [ ] Initialize Next.js 15 project with TypeScript strict mode
- [ ] Set up Tailwind CSS v4
- [ ] Configure next-intl (middleware, routing, message files)
- [ ] Build layout components (Header with locale switcher, Footer, Navigation)
- [ ] Create Home page (Hero, highlights, contact CTA) — both locales
- [ ] Create About page (bio, skills, timeline) — both locales
- [ ] Dark mode toggle
- [ ] Configure `output: 'export'` in next.config.ts
- [ ] Set up GitHub Actions FTP deploy workflow (push to `main` → FTPS)
- [ ] Add FTP secrets to GitHub repository

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
- [ ] Analytics (Vercel Analytics or Plausible)
- [ ] Full accessibility audit
- [ ] Performance optimization pass
- [ ] SEO: structured data, sitemaps, OG images
- [ ] 404 page

### Phase 5: Interactive Projects (post-launch)
- [ ] Mini-project: React Performance Profiler
- [ ] Mini-project: Design Token Generator
- [ ] Mini-project: Remote Team Timezone Coordinator

---

## Deployment

### Strategy
- **Build:** Next.js static export (`output: 'export'`) generates a fully static `out/` directory
- **Deploy:** GitHub Actions on push to `main` → builds → uploads via FTPS to hosting
- **Host:** lucascmedeiros.com.br via FTPS (`ftp.lucascmedeiros.com.br`)
- **Remote directory:** `/htdocs/`
- **Mode:** Clean deploy (deletes remote files before uploading fresh)

### Static Export Implications
Since the site uses `output: 'export'`, these Next.js features are **NOT available**:
- Server-side rendering (SSR) — all pages are statically generated at build time
- API routes (`/api/*`)
- Middleware (next-intl middleware won't run at the edge)
- `next/image` optimization (use `unoptimized: true` or a CDN)
- Incremental Static Regeneration (ISR)

**i18n workaround for static export:** Since middleware can't run, locale detection must happen client-side. The root `/` page should redirect to `/en` or `/pt` based on browser language using a client-side script or meta refresh. All locale routes are pre-rendered at build time via `generateStaticParams`.

### GitHub Secrets Required
The following secrets must be configured in the GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | `ftp.lucascmedeiros.com.br` |
| `FTP_USERNAME` | Your FTP username |
| `FTP_PASSWORD` | Your FTP password |

### Workflow File
Located at `.github/workflows/deploy.yml` — triggers on push to `main` branch.

---

## Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server locally
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # Check types without building
```

---

## Environment Variables

```env
# .env.local (not committed)
NEXT_PUBLIC_SITE_URL=https://lucascmedeiros.com.br
# Future: analytics, contact form API keys
```

---

## Coding Standards

- TypeScript strict mode — no `any`, no implicit returns
- ESLint + Prettier (Next.js default config extended)
- Prefer named exports over default exports (except pages)
- Components: PascalCase files, colocate styles/tests
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- Server Components by default, `"use client"` only when required
- Keep components small and composable
- All text content must go through i18n — never hardcode strings in components

---

## Content Guidelines

- **English content** targets US hiring managers and recruiters
- **Portuguese content** targets Brazilian tech community and local opportunities
- Tone: Professional but approachable, senior-level confidence without arrogance
- Avoid: generic buzzwords, over-explaining basics, listing every technology
- Focus: ownership, impact, decision-making, real metrics
- Resume content should stay in sync with PDF versions

---

## Key Links

- **GitHub:** https://github.com/lucas-webdev
- **LinkedIn:** https://www.linkedin.com/in/lucascmedeiros/
- **Email:** lucascmedeiros.dev@gmail.com
- **Current domain:** lucascmedeiros.com.br
- **Resume (EN):** `C:\Users\Lucas\Documents\Pessoais\CV\Lucas_Medeiros_cv_en.pdf`
- **Resume (PT):** `C:\Users\Lucas\Documents\Pessoais\CV\Lucas_Medeiros_CV_PT.pdf`
