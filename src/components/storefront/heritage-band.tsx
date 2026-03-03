import Image from "next/image";
import type { HomepageSettings } from "@/lib/homepage-settings";

type HeritageBandProps = {
  settings: HomepageSettings;
};

export function HeritageBand({ settings }: HeritageBandProps) {
  const t = settings.texts;

  const heritagePhotos = settings.heritageImages.map((src, i) => ({
    src,
    alt: t[`homepage_text_heritage_caption_${i + 1}`] ?? "",
    caption: t[`homepage_text_heritage_caption_${i + 1}`] ?? "",
    isRemote: src.startsWith("http"),
  }));

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[20px] sm:text-[24px] lg:text-[28px] font-light text-foreground">
            {t.homepage_text_heritage_heading}
          </h2>
        </div>
        <p className="text-[13px] text-muted-foreground max-w-[560px] mb-8 leading-[1.8]">
          {t.homepage_text_heritage_description}
        </p>

        {/* Editorial photo grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {heritagePhotos.map((photo) => (
            <div key={photo.src}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {photo.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
