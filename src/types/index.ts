import type { User, SellerProfile, Product, Category, Order, OrderItem, Review, ProductVariant } from "@prisma/client";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ProductWithRelations = Product & {
  seller: SellerProfile;
  categories: { category: Category }[];
  variants: ProductVariant[];
  reviews: Review[];
  _count?: {
    reviews: number;
    favorites: number;
  };
};

export type OrderWithRelations = Order & {
  items: (OrderItem & {
    product: Product;
    variant: ProductVariant | null;
    seller: SellerProfile;
  })[];
};

export type SellerWithUser = SellerProfile & {
  user: User;
};

export type CategoryWithChildren = Category & {
  children: Category[];
};

export type CartItemWithProduct = {
  id: string;
  quantity: number;
  product: Product & {
    seller: SellerProfile;
  };
  variant: ProductVariant | null;
};
