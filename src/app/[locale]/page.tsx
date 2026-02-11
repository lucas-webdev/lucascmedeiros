import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroSection } from "@/components/sections/hero";
import { HighlightsSection } from "@/components/sections/highlights";
import { CtaSection } from "@/components/sections/cta";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("featuredProjects");

  return (
    <>
      <HeroSection />
      <HighlightsSection />

      {/* Featured Projects placeholder */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            {t("viewAll")} &rarr;
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/30"
            >
              <div className="mb-4 h-2 w-16 rounded bg-accent/20" />
              <div className="mb-2 h-4 w-3/4 rounded bg-muted-foreground/10" />
              <div className="h-3 w-full rounded bg-muted-foreground/10" />
              <div className="mt-1 h-3 w-5/6 rounded bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}
