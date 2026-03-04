# lucascmedeiros.com.br

Personal website and portfolio for **Lucas Cardoso Medeiros** — Senior Frontend Engineer with 8+ years of experience building high-performance web applications.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, static export)
- **Language:** TypeScript (strict mode)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://motion.dev/)
- **i18n:** [next-intl](https://next-intl.dev/) — English and Portuguese
- **Deployment:** GitHub Actions → FTPS

## Pages

| Route | Description |
|-------|-------------|
| `/en` `/pt` | Home — hero, highlights, contact CTA |
| `/en/about` `/pt/about` | Bio, skills, career timeline |
| `/en/projects` `/pt/projects` | Portfolio showcase |
| `/en/blog` `/pt/blog` | Technical blog |
| `/en/resume` `/pt/resume` | Web resume + PDF download |
| `/en/contact` `/pt/contact` | Contact form |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
```

Generates a static `out/` directory ready for deployment.

### Other commands

```bash
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check without building
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/        # Locale-scoped pages (en, pt)
│   │   ├── layout.tsx   # Locale layout with next-intl provider
│   │   ├── page.tsx     # Home
│   │   ├── about/
│   │   ├── projects/
│   │   ├── blog/
│   │   ├── resume/
│   │   └── contact/
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Root redirect (detects browser language)
├── components/
│   ├── ui/              # Reusable primitives
│   ├── layout/          # Header, Footer, Navigation
│   └── sections/        # Page-specific sections
├── i18n/                # next-intl config (routing, navigation)
└── lib/                 # Utilities (cn, etc.)
messages/
├── en.json              # English translations
└── pt.json              # Portuguese translations
```

## Deployment

The site is statically exported and deployed via FTPS on every push to `main`.

The GitHub Actions workflow (`.github/workflows/deploy.yml`) requires these repository secrets:

| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | FTP host |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |

## License

All rights reserved.
