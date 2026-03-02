import Link from "next/link";
import Image from "next/image";
import { MapPin } from "@/components/ui/icons";

const countryNames: Record<string, string> = {
  FR: "France",
  IL: "Israël",
  MA: "Maroc",
  US: "États-Unis",
  GB: "Royaume-Uni",
  TN: "Tunisie",
  DZ: "Algérie",
  ES: "Espagne",
  IT: "Italie",
};

export type FeaturedArtisan = {
  shopName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  verified: boolean;
  shipsFrom: string;
};

type FeaturedArtisansProps = {
  artisans: FeaturedArtisan[];
};

export function FeaturedArtisans({ artisans }: FeaturedArtisansProps) {
  if (artisans.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-[20px] sm:text-[24px] lg:text-[28px] font-light text-foreground">
            Nos artisans
          </h2>
        </div>

        {/* Artisan cards — editorial grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1080px] mx-auto">
          {artisans.map((artisan) => (
            <Link
              key={artisan.slug}
              href={`/seller/${artisan.slug}`}
              className="group block"
            >
              {/* Avatar — large square */}
              <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-5">
                {artisan.logo ? (
                  <Image
                    src={artisan.logo}
                    alt={artisan.shopName}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[40px] font-extralight text-muted-foreground">
                      {artisan.shopName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-[14px] font-medium text-foreground group-hover:underline">
                {artisan.shopName}
              </h3>

              {artisan.description && (
                <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">
                  {artisan.description}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground/60 mt-2 flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} />
                {countryNames[artisan.shipsFrom] ?? artisan.shipsFrom}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
