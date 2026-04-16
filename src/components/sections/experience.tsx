"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const entries = [
  "current",
  "montreal",
  "cgi",
  "emma",
  "mindera",
  "inter",
  "rock",
  "earlier",
] as const;

export function ExperienceSection() {
  const t = useTranslations("experience");

  return (
    <section id="experience" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">{t("title")}</h2>
          <p className="mt-3 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="relative mt-12">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          {entries.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative pl-8 pb-10 last:pb-0"
            >
              <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-accent bg-background" />

              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <h3 className="text-base font-semibold">
                  {t(`items.${key}.role`)}
                </h3>
                <span className="text-sm text-accent">
                  {t(`items.${key}.company`)}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-muted">
                {t(`items.${key}.period`)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`items.${key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
