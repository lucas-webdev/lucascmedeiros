"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function AboutSection() {
  const t = useTranslations("about");

  return (
    <section id="about" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">{t("title")}</h2>
          <div className="mt-8 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
            <p>{t("intro")}</p>
            <p>{t("story")}</p>
            <p>{t("remote")}</p>
            <p>{t("currentFocus")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
