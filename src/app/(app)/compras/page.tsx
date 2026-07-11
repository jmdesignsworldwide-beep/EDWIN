import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Compras" };

export default function ComprasPage() {
  return (
    <PlaceholderPage
      title="Compras"
      subtitle="Órdenes de compra"
      icon={ShoppingCart}
    />
  );
}
