import { useTranslations } from "next-intl";

const skillCategories = [
  "frontend",
  "ui",
  "state",
  "testing",
  "devops",
] as const;

export function SkillsGrid() {
  const t = useTranslations("skills");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skillCategories.map((key) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-accent">
            {t(`${key}.title`)}
          </h3>
          <p className="mt-2 text-sm text-muted">{t(`${key}.items`)}</p>
        </div>
      ))}
    </div>
  );
}
