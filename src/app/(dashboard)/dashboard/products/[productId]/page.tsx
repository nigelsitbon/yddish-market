import { ProductForm } from "@/components/dashboard/product-form";

export const metadata = { title: "Modifier le produit" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductForm productId={productId} />;
}
