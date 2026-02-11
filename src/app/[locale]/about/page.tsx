import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { SkillsGrid } from "@/components/sections/skills-grid";
import { Timeline } from "@/components/sections/timeline";
import { ValuesGrid } from "@/components/sections/values-grid";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("about");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>

      <div className="mt-8 max-w-3xl space-y-4 text-muted leading-relaxed">
        <p>{t("intro")}</p>
        <p>{t("story")}</p>
        <p>{t("remote")}</p>
        <p>{t("currentFocus")}</p>
      </div>

      {/* Skills */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">{t("skillsTitle")}</h2>
        <div className="mt-6">
          <SkillsGrid />
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">{t("timelineTitle")}</h2>
        <div className="mt-6">
          <Timeline />
        </div>
      </section>

      {/* Values */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">{t("valuesTitle")}</h2>
        <div className="mt-6">
          <ValuesGrid />
        </div>
      </section>
    </div>
  );
}
