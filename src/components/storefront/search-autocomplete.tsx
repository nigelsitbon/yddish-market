"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2 } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";

type SearchResult = {
  slug: string;
  title: string;
  price: number;
  images: string[];
  seller: { shopName: string };
};

type SearchAutocompleteProps = {
  onClose: () => void;
};

export function SearchAutocomplete({ onClose }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=5`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data.products ?? json.data ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const handleSelect = (slug: string) => {
    router.push(`/products/${slug}`);
    onClose();
  };

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const showDropdown = focused && query.trim().length >= 2 && (results.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={18}
          strokeWidth={1.5}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Que recherchez-vous ?"
          aria-label="Rechercher un produit"
          className="w-full h-10 pl-8 pr-10 bg-muted/50 text-sm rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground transition-all"
          autoFocus
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        ) : null}
      </form>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border/60 rounded-xl shadow-lg overflow-hidden z-50">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {results.map((product) => (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => handleSelect(product.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="w-10 h-12 bg-[#F5F5F3] rounded-lg overflow-hidden relative flex-shrink-0">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground truncate">{product.title}</p>
                    <p className="text-[11px] text-muted-foreground">{product.seller.shopName}</p>
                  </div>
                  <span className="text-[13px] text-foreground font-medium shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </button>
              ))}
              {query.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={handleSubmit as () => void}
                  className="w-full px-4 py-3 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/40 text-center"
                >
                  Voir tous les résultats pour &quot;{query.trim()}&quot;
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
