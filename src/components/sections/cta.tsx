import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">{t("description")}</p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
