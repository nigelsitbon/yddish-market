import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-[80px] lg:text-[120px] font-extralight text-foreground/10 leading-none select-none">
          404
        </h1>
        <h2 className="text-[20px] lg:text-[24px] font-light text-foreground mt-2 mb-3">
          Page introuvable
        </h2>
        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-8 btn-gradient-dark text-[#FFFFFF] text-[13px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-12 px-8 border border-foreground/20 text-foreground text-[13px] tracking-wide rounded-xl hover:bg-foreground/5 transition-all duration-200"
          >
            Voir les produits
          </Link>
        </div>
      </div>
    </div>
  );
}
