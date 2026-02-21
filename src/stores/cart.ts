import { create } from "zustand";

/* ── Types ── */
export type CartProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  seller: {
    id: string;
    shopName: string;
    slug: string;
    shippingDomestic: number;
    shippingEU: number;
    shippingInternational: number;
    freeShippingThreshold: number | null;
    shipsFrom: string;
  };
};

export type CartVariant = {
  id: string;
  name: string;
  price?: number | null;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product: CartProduct;
  variant?: CartVariant | null;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  setOpen: (open: boolean) => void;
  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  setOpen: (open) => set({ isOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    })),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    })),

  clearCart: () => set({ items: [] }),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => {
      const price = i.variant?.price ?? i.product.price;
      return sum + price * i.quantity;
    }, 0),
}));
