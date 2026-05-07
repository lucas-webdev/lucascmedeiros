"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const skillCategories = [
  "frontend",
  "ui",
  "state",
  "testing",
  "devops",
] as const;

export function SkillsSection() {
  const t = useTranslations("skills");

  return (
    <section
      id="skills"
      className="relative py-28 md:py-40"
      style={{
        backgroundImage: "url('/images/dev-bg-1.webp')",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-background/85 dark:bg-background/90" />
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">{t("title")}</h2>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillCategories.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg border border-border bg-background p-5"
            >
              <h3 className="text-sm font-semibold text-accent">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted">{t(`${key}.items`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
