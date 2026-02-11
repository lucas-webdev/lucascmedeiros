"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="mx-auto max-w-5xl px-6 py-20 md:py-32">
      <motion.div
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
        <p className="mt-2 text-xl text-accent font-medium md:text-2xl">
          {t("title")}
        </p>
        <p className="mt-4 max-w-2xl text-lg text-muted leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            {t("cta")}
          </Link>
          <Link
            href="/resume"
            className="inline-flex items-center rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent-muted hover:text-accent"
          >
            {t("resumeCta")}
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{t("location")}</p>
      </motion.div>
    </section>
  );
}
