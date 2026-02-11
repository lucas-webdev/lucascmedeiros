import { useTranslations } from "next-intl";

const values = ["ownership", "pragmatism", "communication", "growth"] as const;

export function ValuesGrid() {
  const t = useTranslations("about.values");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {values.map((key) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-card p-5"
        >
          <h3 className="font-semibold">{t(`${key}.title`)}</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {t(`${key}.description`)}
          </p>
        </div>
      ))}
    </div>
  );
}
