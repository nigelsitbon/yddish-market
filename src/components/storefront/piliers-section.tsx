import type { HomepageSettings } from "@/lib/homepage-settings";

type PiliersSectionProps = {
  settings: HomepageSettings;
};

export function PiliersSection({ settings }: PiliersSectionProps) {
  const t = settings.texts;

  const piliers = [
    {
      title: t.homepage_text_pilier_1_title,
      description: t.homepage_text_pilier_1_description,
    },
    {
      title: t.homepage_text_pilier_2_title,
      description: t.homepage_text_pilier_2_description,
    },
    {
      title: t.homepage_text_pilier_3_title,
      description: t.homepage_text_pilier_3_description,
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="mb-12">
          <h2 className="text-[20px] sm:text-[24px] lg:text-[28px] font-light text-foreground">
            Nos trois piliers
          </h2>
        </div>

        {/* 3 pillars grid */}
        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          {piliers.map((pilier) => (
            <div key={pilier.title}>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-4">
                {pilier.title}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-[1.8]">
                {pilier.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
