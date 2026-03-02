"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "@/components/ui/icons";

type Category = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

type CatalogFiltersProps = {
  categories: Category[];
};

const sortOptions = [
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "trending", label: "Tendances" },
];

const priceRanges = [
  { value: "0-50", label: "Moins de 50 €" },
  { value: "50-100", label: "50 - 100 €" },
  { value: "100-250", label: "100 - 250 €" },
  { value: "250-500", label: "250 - 500 €" },
  { value: "500-", label: "Plus de 500 €" },
];

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const activePrice = searchParams.get("price") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname]
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = activeCategory || activePrice;

  return (
    <div>
      {/* Top bar: filter toggle + sort + breadcrumb */}
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 text-[13px] px-4 py-1.5 border transition-all duration-200 rounded-full ${
              filtersOpen
                ? "border-foreground bg-foreground text-[#FFFFFF]"
                : "border-border text-foreground hover:border-foreground"
            }`}
          >
            {filtersOpen ? <X size={14} strokeWidth={1.5} /> : <SlidersHorizontal size={14} strokeWidth={1.5} />}
            {filtersOpen ? "Fermer" : "Filtres"}
          </button>

          {/* Active filter pills */}
          {categories.map((cat) =>
            cat.slug === activeCategory ? (
              <button
                key={cat.slug}
                type="button"
                onClick={() => updateParams("category", "")}
                className="flex items-center gap-1 px-3 py-1 text-[12px] border border-foreground text-foreground rounded-full"
              >
                {cat.name}
                <X size={12} />
              </button>
            ) : null
          )}
          {categories.flatMap((c) => c.children).map((sub) =>
            sub.slug === activeCategory ? (
              <button
                key={sub.slug}
                type="button"
                onClick={() => updateParams("category", "")}
                className="flex items-center gap-1 px-3 py-1 text-[12px] border border-foreground text-foreground rounded-full"
              >
                {sub.name}
                <X size={12} />
              </button>
            ) : null
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[12px] text-muted-foreground underline hover:text-foreground"
            >
              Effacer tout
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1">
            <label htmlFor="sort-select" className="text-[13px] text-muted-foreground">Trier</label>
            <select
              id="sort-select"
              value={activeSort}
              onChange={(e) => updateParams("sort", e.target.value)}
              className="text-[13px] text-foreground bg-transparent border-0 focus:outline-none cursor-pointer appearance-none pr-5"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="text-foreground -ml-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expanded filters panel */}
      {filtersOpen && (
        <div className="border-b border-border py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Categories */}
            <div>
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-4">
                Categories
              </h2>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => updateParams("category", "")}
                  className={`block text-[13px] py-1 transition-colors ${
                    !activeCategory ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tous les produits
                </button>
                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <button
                      type="button"
                      onClick={() => updateParams("category", cat.slug)}
                      className={`block text-[13px] py-1 transition-colors ${
                        activeCategory === cat.slug
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                    {(activeCategory === cat.slug ||
                      cat.children.some((c) => c.slug === activeCategory)) && (
                      <div className="ml-4 space-y-0.5">
                        {cat.children.map((sub) => (
                          <button
                            key={sub.slug}
                            type="button"
                            onClick={() => updateParams("category", sub.slug)}
                            className={`block text-[12px] py-0.5 transition-colors ${
                              activeCategory === sub.slug
                                ? "text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-4">
                Prix
              </h2>
              <div className="space-y-1">
                {priceRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() =>
                      updateParams("price", activePrice === range.value ? "" : range.value)
                    }
                    className={`block text-[13px] py-1 transition-colors ${
                      activePrice === range.value
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick category pills (Farfetch-style) */}
      {!filtersOpen && (
        <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateParams("category", cat.slug === activeCategory ? "" : cat.slug)}
              className={`whitespace-nowrap px-4 py-1.5 text-[12px] border transition-all duration-200 rounded-full ${
                activeCategory === cat.slug
                  ? "border-foreground bg-foreground text-[#FFFFFF]"
                  : "border-border text-foreground hover:border-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
