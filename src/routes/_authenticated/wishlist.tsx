import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountLayout } from "@/components/layout/AccountLayout";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({ meta: [
    { title: "Wishlist — ZEAN TENAN" },
    { name: "description", content: "Simpan gamis dan daster favorit Anda dari koleksi ZEAN TENAN untuk dibeli nanti." },
  ] }),
  component: () => (
    <AccountLayout title="Wishlist" description="Produk yang Anda simpan untuk dibeli nanti.">
      <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Fitur Wishlist akan aktif pada fase berikutnya. Sementara ini, silakan jelajahi
        <Link to="/produk" className="ml-1 text-primary underline">katalog</Link>.
      </div>
    </AccountLayout>
  ),
});