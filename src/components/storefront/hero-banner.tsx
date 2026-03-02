import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { HomepageSettings } from "@/lib/homepage-settings";

type HeroBannerProps = {
  settings: HomepageSettings;
};

export function HeroBanner({ settings }: HeroBannerProps) {
  const t = settings.texts;
  const heroImage = settings.heroImage;
  const titleLines = (t.homepage_text_hero_title ?? "").split("\n");
  const isRemoteImage = heroImage.startsWith("http");

  return (
    <section className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
      <div className="grid lg:grid-cols-2 min-h-[calc(100dvh-140px)] lg:min-h-[calc(100dvh-140px)] max-h-[900px]">
        {/* Left — text block */}
        <div className="flex flex-col justify-center py-16 sm:py-20 lg:py-0 lg:pr-16 xl:pr-24 order-2 lg:order-1">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
            Yddish Market
          </p>
          <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] xl:text-[50px] font-extralight text-foreground leading-[1.2] tracking-[0.02em]">
            {titleLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h1>
          <p className="mt-6 text-[14px] sm:text-[15px] text-muted-foreground leading-[1.8] max-w-[440px]">
            {t.homepage_text_hero_subtitle}
          </p>
          <div className="mt-10">
            <Link
              href="/products"
              className="inline-flex items-center h-12 px-8 text-[12px] tracking-[0.2em] uppercase font-medium border border-foreground text-foreground hover:bg-foreground hover:text-white transition-all duration-300 rounded-xl"
            >
              {t.homepage_text_hero_cta}
            </Link>
          </div>
        </div>

        {/* Right — B&W photo */}
        <div className="relative order-1 lg:order-2 min-h-[360px] sm:min-h-[460px] lg:min-h-full">
          <Image
            src={heroImage}
            alt="Artisan dans son atelier"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center grayscale"
            {...(isRemoteImage ? { unoptimized: false } : {})}
          />
        </div>
      </div>
    </section>
  );
}
