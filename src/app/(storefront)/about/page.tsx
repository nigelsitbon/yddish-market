import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notre manifeste — YDDISH MARKET",
  description:
    "Yddish Market est la première marketplace dédiée aux objets judaïques d'exception. Artisanat, authenticité, héritage.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
      {/* Hero */}
      <header className="py-16 sm:py-20 lg:py-28 max-w-[780px]">
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
          Notre manifeste
        </p>
        <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] font-extralight text-foreground leading-[1.2] tracking-[0.02em]">
          Depuis des siècles, nos mains créent.
        </h1>
      </header>

      {/* Intro paragraphs */}
      <section className="max-w-[680px] space-y-6 text-[15px] leading-[1.9] text-foreground/80">
        <p>
          Pendant des siècles, où qu&apos;ils aillent, les Juifs ont créé avec
          leurs mains. Graveurs de cuivre dans les souks de Fès. Orfèvres dans
          les mellahs du Maroc. Cordonniers à Salonique. Tailleurs à Varsovie.
          Souffleurs de verre à Hébron.
        </p>
        <p>
          Partout où la diaspora s&apos;est installée, elle a produit des objets
          — utiles, beaux, sacrés.
        </p>
        <p>
          Ces objets portaient en eux une double nature : l&apos;urgence du
          quotidien et la permanence du rituel. Un chandelier n&apos;était
          jamais seulement un chandelier. Une mezuzah n&apos;était jamais
          seulement un boîtier. Chaque pièce contenait l&apos;histoire
          d&apos;une famille, la mémoire d&apos;un lieu, la continuité
          d&apos;une promesse.
        </p>
        <p className="text-[17px] font-light text-foreground">
          Yddish Market existe pour que cette chaîne ne se brise pas.
        </p>
      </section>

      {/* Archive photos band */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 my-16 sm:my-20">
        {[
          { src: "/images/heritage/3.png", alt: "Couturières au mellah" },
          { src: "/images/heritage/2.png", alt: "Cordonnier au souk" },
          { src: "/images/heritage/4.png", alt: "Orfèvre à l'atelier" },
        ].map((photo) => (
          <div
            key={photo.src}
            className="relative aspect-[4/5] overflow-hidden rounded-xl"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Ce que nous sommes */}
      <section className="max-w-[680px] mb-16 sm:mb-20">
        <h2 className="text-[20px] sm:text-[24px] font-light text-foreground mb-6">
          Ce que nous sommes
        </h2>
        <div className="space-y-6 text-[15px] leading-[1.9] text-foreground/80">
          <p>
            Nous ne sommes pas un catalogue. Nous sommes une galerie.
          </p>
          <p>
            Yddish Market est la première marketplace dédiée aux objets
            judaïques d&apos;exception. Chaque pièce présentée sur notre
            plateforme a été sélectionnée à la main, validée par notre comité,
            et jugée digne de rejoindre une collection qui se transmet.
          </p>
          <p>
            Nous connectons les meilleurs créateurs judaïques du monde — d&apos;Israël
            au Maroc, de New York à Paris — avec une communauté qui cherche plus
            qu&apos;un produit : une pièce qui a une âme.
          </p>
        </div>
      </section>

      {/* Trois piliers */}
      <section className="mb-16 sm:mb-20">
        <h2 className="text-[20px] sm:text-[24px] font-light text-foreground mb-10">
          Nos trois piliers
        </h2>
        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-4">
              Artisanat
            </h3>
            <p className="text-[14px] text-muted-foreground leading-[1.8]">
              Derrière chaque objet, il y a des mains. Des mains qui maîtrisent
              un geste répété depuis des générations, ou des mains qui
              réinventent ce geste avec des outils nouveaux. Nous ne faisons pas
              de distinction entre tradition et modernité — nous faisons la
              distinction entre ce qui est fait avec intention et ce qui ne
              l&apos;est pas.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-4">
              Authenticité
            </h3>
            <p className="text-[14px] text-muted-foreground leading-[1.8]">
              Nous ne vendons rien qui n&apos;ait pas d&apos;histoire à
              raconter. L&apos;authenticité, pour nous, c&apos;est connaître
              l&apos;origine : qui a fabriqué cet objet, où, comment, et
              pourquoi. C&apos;est pouvoir retracer le chemin qui va de la
              matière première à l&apos;objet fini.
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-4">
              Héritage
            </h3>
            <p className="text-[14px] text-muted-foreground leading-[1.8]">
              Le judaïsme est une culture de la transmission. On transmet les
              textes, les rites, les chants — et on transmet aussi les objets.
              Une menorah allumée par trois générations n&apos;a pas la même
              lumière qu&apos;une menorah neuve. Yddish Market sélectionne des
              objets qui sont faits pour durer et pour être donnés.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Notre promesse */}
      <section className="max-w-[680px] py-16 sm:py-20">
        <h2 className="text-[20px] sm:text-[24px] font-light text-foreground mb-6">
          Notre promesse
        </h2>
        <div className="space-y-8 text-[15px] leading-[1.9] text-foreground/80">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-3">
              À nos acheteurs
            </p>
            <p>
              Si c&apos;est sur Yddish Market, c&apos;est que ça mérite d&apos;y
              être. Chaque objet a été inspecté, chaque artisan a été vérifié,
              chaque histoire a été racontée. Vous n&apos;achetez pas un produit
              — vous choisissez une pièce qui fera partie de votre histoire.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground mb-3">
              À nos artisans
            </p>
            <p>
              Nous ne sommes pas une vitrine de plus. Nous sommes un écrin.
              Votre travail mérite d&apos;être vu par des gens qui comprennent
              sa valeur, et présenté dans un cadre à la hauteur de votre
              savoir-faire.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* L'héritage revisité */}
      <section className="max-w-[680px] py-16 sm:py-20">
        <h2 className="text-[20px] sm:text-[24px] font-light text-foreground mb-6">
          L&apos;héritage, revisité
        </h2>
        <div className="space-y-6 text-[15px] leading-[1.9] text-foreground/80">
          <p>
            Nous ne sommes pas nostalgiques. Les photos d&apos;archives qui
            accompagnent notre identité ne sont pas là pour dire « c&apos;était
            mieux avant ». Elles sont là pour dire : regardez d&apos;où nous
            venons. Regardez ce que ces mains ont su faire, parfois dans les
            conditions les plus difficiles.
          </p>
          <p>
            Yddish Market est le pont entre hier et demain. Entre le graveur de
            cuivre de Fès et l&apos;orfèvre contemporain de Tel Aviv. Entre la
            mezuzah en bois sculpté d&apos;un shtetl et celle, en verre soufflé,
            d&apos;un atelier de Brooklyn.
          </p>
          <p className="text-[17px] font-light text-foreground leading-[1.6]">
            Nous n&apos;avons pas créé une boutique.
            <br />
            Nous avons ouvert un lieu de mémoire vivante.
          </p>
        </div>
      </section>

      {/* Bottom band */}
      <div className="border-t border-border py-12 sm:py-16 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
            Artisanat &middot; Authenticité &middot; Héritage
          </p>
          <Link
            href="/products"
            className="inline-flex items-center h-11 px-7 text-[11px] tracking-[0.15em] uppercase font-medium border border-foreground text-foreground hover:bg-foreground hover:text-white transition-all duration-300 rounded-xl"
          >
            Explorer la collection
          </Link>
        </div>
      </div>
    </article>
  );
}
