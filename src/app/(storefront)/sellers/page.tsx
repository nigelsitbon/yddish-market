import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Store, Star, Package } from "lucide-react";

export const metadata = {
  title: "Nos artisans — YDDISH MARKET",
  description: "Découvrez les artisans vérifiés de YDDISH MARKET. Bijoutiers, calligraphes, orfèvres et créateurs au service de la culture judaïque.",
};

export const dynamic = "force-dynamic";

async function getSellers() {
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      products: { some: { status: "ACTIVE" } },
    },
    select: {
      id: true,
      shopName: true,
      slug: true,
      description: true,
      logo: true,
      verified: true,
      rating: true,
      totalSales: true,
      shipsFrom: true,
      _count: {
        select: {
          products: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { totalSales: "desc" },
  });

  return sellers;
}

export default async function SellersPage() {
  const sellers = await getSellers();

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <div className="max-w-[800px]">
        <h1 className="text-[28px] font-light text-foreground mb-2">
          Nos artisans
        </h1>
        <p className="text-[13px] text-muted-foreground mb-8">
          Découvrez les artisans qui font vivre YDDISH MARKET. Chacun est
          sélectionné pour la qualité de son travail et son authenticité.
        </p>
      </div>

      {sellers.length === 0 ? (
        <div className="py-20 text-center">
          <Store size={32} strokeWidth={1} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-[14px] text-muted-foreground mb-4">
            Aucun artisan pour le moment
          </p>
          <Link
            href="/become-seller"
            className="inline-flex items-center gap-2 h-10 px-5 btn-gradient-accent text-[#FFFFFF] text-[12px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Devenir le premier vendeur
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.slug}`}
              className="group border border-border/60 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {/* Banner / Header */}
              <div className="h-24 bg-gradient-to-br from-accent/10 via-accent/5 to-muted relative">
                {/* Avatar */}
                <div className="absolute -bottom-6 left-5">
                  <div className="w-14 h-14 rounded-xl border-2 border-white bg-muted flex items-center justify-center overflow-hidden shadow-sm relative">
                    {seller.logo ? (
                      <Image src={seller.logo} alt={seller.shopName} fill className="object-cover" sizes="56px" />
                    ) : (
                      <Store size={20} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 pt-9">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[14px] font-medium text-foreground group-hover:text-accent transition-colors">
                    {seller.shopName}
                  </h2>
                  {seller.verified && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                      Vérifié
                    </span>
                  )}
                </div>

                {seller.description && (
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
                    {seller.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package size={12} />
                    {seller._count.products} produit{seller._count.products > 1 ? "s" : ""}
                  </span>
                  {seller.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-accent" />
                      {seller.rating.toFixed(1)}
                    </span>
                  )}
                  {seller.totalSales > 0 && (
                    <span>
                      {seller.totalSales} vente{seller.totalSales > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 text-center py-8 border-t border-border">
        <p className="text-[14px] text-foreground mb-4">
          Vous êtes artisan ? Rejoignez notre communauté.
        </p>
        <Link
          href="/become-seller"
          className="inline-flex items-center gap-2 h-11 px-6 btn-gradient-accent text-[#FFFFFF] text-[13px] font-medium tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Devenir vendeur
        </Link>
      </div>
    </div>
  );
}
