import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";

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
