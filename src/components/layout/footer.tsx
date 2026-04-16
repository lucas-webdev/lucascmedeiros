import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 sm:flex-row">
        <p className="text-sm text-muted">
          &copy; {currentYear} Lucas Medeiros. {t("rights")}
        </p>
        <p className="text-xs text-muted-foreground">{t("builtWith")}</p>
      </div>
    </footer>
  );
}
