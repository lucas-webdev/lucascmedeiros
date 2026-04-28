"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { TechBackground } from "./tech-background";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section
      id="hero"
      className="relative -mt-[69px] flex min-h-screen max-h-screen items-center overflow-hidden pt-[69px]"
      style={{ background: "linear-gradient(to bottom, black 70%, #040462)" }}
    >
      <TechBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col-reverse items-center gap-10 px-6 py-20 md:flex-row md:gap-16 md:py-32">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-muted">
              {t("available")}
            </span>
          </div>

          <p className="text-lg text-muted">{t("greeting")}</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight md:text-6xl">
            {t("name")}
          </h1>
          <p className="mt-2 text-xl font-medium text-accent md:text-2xl">
            {t("title")}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="inline-flex items-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {t("cta")}
            </a>
            <a
              href="#about"
              className="inline-flex items-center rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent-muted hover:text-accent"
            >
              {t("resumeCta")}
            </a>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{t("location")}</p>
        </motion.div>

        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img
            src="/images/lucas.jpg"
            alt={t("photoAlt")}
            width={240}
            height={240}
            className="h-48 w-48 rounded-full border-4 border-accent/20 shadow-lg md:h-60 md:w-60"
          />
        </motion.div>
      </div>
    </section>
  );
}
