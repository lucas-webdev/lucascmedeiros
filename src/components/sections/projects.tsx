"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const projectKeys = ["refersion", "healthcare", "ecommerce"] as const;

export function ProjectsSection() {
  const t = useTranslations("projects");

  return (
    <section
      id="projects"
      className="relative py-28 md:py-40"
      style={{
        backgroundImage: "url('/images/dev-bg-2.webp')",
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projectKeys.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/30"
            >
              <h3 className="text-lg font-semibold">
                {t(`items.${key}.name`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`items.${key}.description`)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t(`items.${key}.tags`)
                  .split(", ")
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
