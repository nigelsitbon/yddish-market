import Image from "next/image";
import Link from "next/link";

export function HeroBanner() {
  return (
    <section className="relative w-full h-[340px] sm:h-[420px] lg:h-[500px] overflow-hidden">
      {/* Full-width artisan image */}
      <Image
        src="/images/hero-artisan.jpg"
        alt="Artisan dans son atelier"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Subtle dark overlay — stronger for sepia image */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Centered tagline */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <p className="text-white/60 text-[10px] sm:text-[11px] tracking-[0.4em] uppercase mb-4">
          Yddish Market
        </p>
        <h2 className="text-white text-center font-extralight text-[22px] sm:text-[28px] lg:text-[36px] tracking-[0.15em] sm:tracking-[0.2em] leading-relaxed">
          L&apos;artisanat judaïque d&apos;exception
        </h2>
        <div className="mt-6 w-8 h-px bg-white/30" />
        <Link
          href="/products"
          className="mt-6 text-white/50 text-[11px] tracking-[0.3em] uppercase hover:text-white/80 transition-colors duration-300"
        >
          Découvrir
        </Link>
      </div>
    </section>
  );
}
