"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const testimonialKeys = ["testimonial1", "testimonial2"] as const;

export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section id="testimonials" className="bg-card py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">{t("title")}</h2>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {testimonialKeys.map((key, i) => (
            <motion.blockquote
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="rounded-lg border border-border bg-background p-6"
            >
              <p className="text-base italic leading-relaxed text-muted">
                &ldquo;{t(`items.${key}.quote`)}&rdquo;
              </p>
              <footer className="mt-4">
                <a
                  href={t(`items.${key}.linkedin`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold group-hover:text-accent transition-colors">
                      {t(`items.${key}.name`)}
                    </p>
                    <p className="text-xs text-muted">
                      {t(`items.${key}.role`)}
                    </p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="shrink-0 text-muted group-hover:text-accent transition-colors"
                  >
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                </a>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
