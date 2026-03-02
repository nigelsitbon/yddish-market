import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/* ── Default values (current hardcoded content) ── */

const DEFAULTS: Record<string, string> = {
  // Hero
  homepage_text_hero_title:
    "Depuis des siècles,\nnos mains créent.",
  homepage_text_hero_subtitle:
    "Chaque objet sur Yddish Market est sélectionné pour son savoir-faire, son authenticité et son histoire. Nous ne vendons pas des produits — nous transmettons un héritage.",
  homepage_text_hero_cta: "Explorer la collection",

  // Collection 1 — Shabbat
  homepage_text_collection_1_title: "Shabbat — préparer sa table",
  homepage_text_collection_1_description:
    "Les objets qui transforment chaque vendredi soir en moment sacré. Bougeoirs, nappes, couverts et kiddoush.",

  // Collection 2 — Bijoux
  homepage_text_collection_2_title: "Porter sa foi",
  homepage_text_collection_2_description:
    "Bijoux et ornements qui portent en eux des siècles de tradition. Chaï, étoile de David, hamsas.",

  // Collection 3 — Mezuzot
  homepage_text_collection_3_title: "Le seuil sacré",
  homepage_text_collection_3_description:
    "Mézouzot et objets qui sanctifient l'entrée de votre foyer. Artisanat d'exception.",

  // Piliers
  homepage_text_pilier_1_title: "Artisanat",
  homepage_text_pilier_1_description:
    "Derrière chaque objet, il y a des mains. Des mains qui maîtrisent un geste répété depuis des générations, ou qui le réinventent avec des outils nouveaux. Nous ne faisons pas de distinction entre tradition et modernité — nous distinguons ce qui est fait avec intention.",
  homepage_text_pilier_2_title: "Authenticité",
  homepage_text_pilier_2_description:
    "Nous ne vendons rien qui n'ait pas d'histoire à raconter. Connaître l'origine : qui a fabriqué cet objet, où, comment, et pourquoi. Retracer le chemin qui va de la matière première à l'objet fini.",
  homepage_text_pilier_3_title: "Héritage",
  homepage_text_pilier_3_description:
    "Le judaïsme est une culture de la transmission. On transmet les textes, les rites, les chants — et on transmet aussi les objets. Yddish Market sélectionne des objets qui sont faits pour durer et pour être donnés.",

  // Heritage section
  homepage_text_heritage_heading: "L'Héritage",
  homepage_text_heritage_description:
    "Graveurs de cuivre dans les souks de Fès. Orfèvres dans les mellahs du Maroc. Cordonniers à Salonique. Partout où la diaspora s'est installée, elle a produit des objets — utiles, beaux, sacrés.",
  homepage_text_heritage_caption_1: "Couturières au mellah",
  homepage_text_heritage_caption_2: "Cordonnier au souk",
  homepage_text_heritage_caption_3: "Orfèvre à l'atelier",
  homepage_text_heritage_caption_4: "Potier à Jérusalem",
  homepage_text_heritage_caption_5: "Graveur au Maroc",
  homepage_text_heritage_caption_6: "Ferblantier au mellah",
};

/* ── Default heritage images (local files) ── */

const DEFAULT_HERITAGE_IMAGES = [
  "/images/heritage/3.png",
  "/images/heritage/2.png",
  "/images/heritage/4.png",
  "/images/heritage/5.png",
  "/images/heritage/1.png",
  "/images/heritage/6.png",
];

/* ── Types ── */

export type HomepageSettings = {
  heroImage: string;
  heritageImages: string[];
  texts: Record<string, string>;
};

/* ── Cached fetch ── */

export const getHomepageSettings = unstable_cache(
  async (): Promise<HomepageSettings> => {
    const settings = await prisma.siteSetting.findMany({
      where: {
        OR: [
          { key: { startsWith: "homepage_text_" } },
          { key: "hero_image" },
          { key: { startsWith: "heritage_image_" } },
        ],
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    // Merge defaults with DB values for texts
    const texts: Record<string, string> = {};
    for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
      texts[key] = map[key] || defaultVal;
    }

    // Hero image with fallback
    const heroImage = map["hero_image"] || "/images/hero-artisan.jpg";

    // Heritage images with per-slot fallbacks
    const heritageImages = Array.from({ length: 6 }, (_, i) => {
      return map[`heritage_image_${i + 1}`] || DEFAULT_HERITAGE_IMAGES[i];
    });

    return { heroImage, heritageImages, texts };
  },
  ["homepage-settings"],
  { revalidate: 300, tags: ["homepage"] }
);

/* ── Export defaults for admin UI ── */
export { DEFAULTS as HOMEPAGE_DEFAULTS };
