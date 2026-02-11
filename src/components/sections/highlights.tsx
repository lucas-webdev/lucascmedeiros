"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const stats = ["experience", "performance", "testing", "components"] as const;

export function HighlightsSection() {
  const t = useTranslations("highlights");

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">{t("title")}</h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-accent md:text-4xl">
                {t(`${key}.value`)}
              </p>
              <p className="mt-2 text-sm text-muted">{t(`${key}.label`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
