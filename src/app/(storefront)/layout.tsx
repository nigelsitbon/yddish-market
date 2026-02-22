import dynamic from "next/dynamic";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";

const CartDrawer = dynamic(
  () => import("@/components/storefront/cart-drawer").then((m) => m.CartDrawer),
);

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
