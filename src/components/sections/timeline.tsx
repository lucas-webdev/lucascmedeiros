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

export function Timeline() {
  const t = useTranslations("timeline");

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      {entries.map((key, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          viewport={{ once: true }}
          className="relative pl-8 pb-8 last:pb-0"
        >
          {/* Dot */}
          <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-accent bg-background" />

          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-sm font-semibold">{t(`${key}.role`)}</h3>
              <span className="text-xs text-muted-foreground">
                {t(`${key}.period`)}
              </span>
            </div>
            <p className="text-sm text-accent">{t(`${key}.company`)}</p>
            <p className="mt-1 text-sm text-muted">
              {t(`${key}.description`)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
