import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Vêtements",
    slug: "vetements",
    icon: "Shirt",
    children: [
      { name: "Kippa", slug: "kippa" },
      { name: "Talith", slug: "talith" },
      { name: "Maillot de Bain", slug: "maillot-de-bain" },
      { name: "Foulards", slug: "foulards" },
      { name: "Chapeaux", slug: "chapeaux" },
      { name: "Hoodie", slug: "hoodie" },
      { name: "Pantalon", slug: "pantalon" },
      { name: "T-Shirt", slug: "t-shirt" },
    ],
  },
  {
    name: "Bijoux",
    slug: "bijoux",
    icon: "Gem",
    children: [
      { name: "Bracelets", slug: "bracelets" },
      { name: "Colliers", slug: "colliers" },
      { name: "Bagues", slug: "bagues" },
    ],
  },
  {
    name: "Art & Accessoires",
    slug: "art-accessoires",
    icon: "Palette",
    children: [
      { name: "Hanoukia", slug: "hanoukia" },
      { name: "Choffar", slug: "choffar" },
      { name: "Tableaux", slug: "tableaux" },
      { name: "Lithographies", slug: "lithographies" },
      { name: "Photographies", slug: "photographies" },
      { name: "Plateau à Pain", slug: "plateau-a-pain" },
      { name: "Nappes de Chabbat", slug: "nappes-de-chabbat" },
      { name: "Verre de Kidouche", slug: "verre-de-kidouche" },
      { name: "Seder de Pessah", slug: "seder-de-pessah" },
      { name: "Sacs de Téfilines", slug: "sacs-de-tefilines" },
      { name: "Pochette de Téfilines", slug: "pochette-de-tefilines" },
      { name: "Pochette de Talith", slug: "pochette-de-talith" },
      { name: "Pochette", slug: "pochette" },
      { name: "Mézouza", slug: "mezouza" },
      { name: "Bougeoir", slug: "bougeoir" },
      { name: "Tsédaka", slug: "tsedaka" },
    ],
  },
  {
    name: "Livres",
    slug: "livres",
    icon: "BookOpen",
    children: [
      { name: "Sidour", slug: "sidour" },
      { name: "Mahzor", slug: "mahzor" },
      { name: "Livres d'Études", slug: "livres-etudes" },
      { name: "Méguila", slug: "meguila" },
    ],
  },
  {
    name: "Fêtes",
    slug: "fetes",
    icon: "Sparkles",
    children: [
      { name: "Chabbat", slug: "chabbat" },
      { name: "Hanouka", slug: "hanouka" },
      { name: "Pessah", slug: "pessah" },
      { name: "Pourim", slug: "pourim" },
      { name: "Soukkot", slug: "soukkot" },
      { name: "Rosh Hashana", slug: "rosh-hashana" },
    ],
  },
  {
    name: "Épicerie Fine",
    slug: "epicerie-fine",
    icon: "Wine",
    children: [
      { name: "Vins & Spiritueux", slug: "vins-spiritueux" },
      { name: "Pâtisserie & Confiserie", slug: "patisserie-confiserie" },
      { name: "Épices & Condiments", slug: "epices-condiments" },
    ],
  },
];

async function main() {
  console.log("Seeding categories...");

  // Clean old categories and join table
  await prisma.productCategory.deleteMany();
  await prisma.category.deleteMany();

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        order: i,
      },
    });

    if (cat.children) {
      for (let j = 0; j < cat.children.length; j++) {
        const child = cat.children[j];
        await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            parentId: parent.id,
            order: j,
          },
        });
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
