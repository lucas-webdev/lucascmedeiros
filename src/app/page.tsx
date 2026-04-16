import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about";
import { SkillsSection } from "@/components/sections/skills-grid";
import { ExperienceSection } from "@/components/sections/experience";
import { ProjectsSection } from "@/components/sections/projects";
import { OpenSourceSection } from "@/components/sections/open-source";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { ContactSection } from "@/components/sections/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL("https://lucascmedeiros.com.br"),
    alternates: {
      languages: {
        en: "/en",
        pt: "/pt",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://lucascmedeiros.com.br",
      siteName: "Lucas Medeiros",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function RootPage() {
  setRequestLocale("en");
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <HeroSection />
            <AboutSection />
            <SkillsSection />
            <ExperienceSection />
            <ProjectsSection />
            <OpenSourceSection />
            <TestimonialsSection />
            <ContactSection />
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
