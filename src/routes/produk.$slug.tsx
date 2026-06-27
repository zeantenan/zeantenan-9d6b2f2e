import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Heart } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./index";
import { getProductBySlug } from "@/lib/products.functions";
import { addToCart } from "@/lib/cart.functions";
import { formatIDR } from "@/lib/format";
import { publicMediaUrl } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

const qo = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/produk/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(qo(params.slug));
    if (!data) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — ZEAN TENAN` },
      { name: "description", content: `Belanja ${params.slug.replace(/-/g, " ")} original dari Pekalongan. Kualitas premium, motif batik khas Kota Batik Indonesia.` },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — ZEAN TENAN` },
      { property: "og:description", content: `${params.slug.replace(/-/g, " ")} original ZEAN TENAN — langsung dari pengrajin Pekalongan.` },
    ],
  }),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Produk tidak ditemukan</h1>
        <p className="mt-3 text-sm text-muted-foreground">Produk yang Anda cari mungkin sudah tidak tersedia.</p>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Gagal memuat produk</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PublicLayout>
  ),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(slug));
  const product: any = data!.product;
  const related: any[] = data!.related;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const images = (product.product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [activeImg, setActiveImg] = useState(0);
  const variants = (product.product_variants ?? []).filter((v: any) => v.is_active);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const variant = variants.find((v: any) => v.id === variantId);
  const [qty, setQty] = useState(1);

  const hasDiscount = product.discount_price && Number(product.discount_price) > 0 && Number(product.discount_price) < Number(product.price);
  const price = variant?.price_override ?? (hasDiscount ? product.discount_price : product.price);

  const addFn = useServerFn(addToCart);
  const m = useMutation({
    mutationFn: addFn,
    onSuccess: () => {
      toast.success("Ditambahkan ke keranjang");
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: any) => toast.error("Gagal", { description: e.message }),
  });

  async function handleAdd(thenCheckout: boolean) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast("Silakan masuk", { description: "Anda perlu masuk untuk berbelanja." });
      navigate({ to: "/auth" });
      return;
    }
    await m.mutateAsync({ data: { productId: product.id, variantId, quantity: qty } });
    if (thenCheckout) navigate({ to: "/keranjang" });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <a href="/" className="hover:text-foreground">Beranda</a> · <a href="/produk" className="hover:text-foreground">Katalog</a> · <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/5] w-full overflow-hidden border border-border bg-secondary">
              {images[activeImg] ? (
                <img src={publicMediaUrl(images[activeImg].url)} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">ZEAN · TENAN</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.url}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square overflow-hidden border ${i === activeImg ? "border-primary" : "border-border"}`}
                  >
                    <img src={publicMediaUrl(img.url)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.categories?.name && (
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{product.categories.name}</p>
            )}
            <h1 className="mt-3 font-display text-4xl text-foreground">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl text-foreground">{formatIDR(price)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">{formatIDR(product.price)}</span>
              )}
            </div>
            {product.short_description && (
              <p className="mt-6 text-sm text-muted-foreground">{product.short_description}</p>
            )}

            {variants.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pilih Varian</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((v: any) => {
                    const label = [v.size, v.color].filter(Boolean).join(" / ") || v.sku || "Varian";
                    const out = v.stock <= 0;
                    const active = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        disabled={out}
                        className={`border px-4 py-2 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"} ${out ? "opacity-40" : ""}`}
                      >
                        {label} {out && "(Habis)"}
                      </button>
                    );
                  })}
                </div>
                {variant && (
                  <p className="mt-2 text-xs text-muted-foreground">Stok tersedia: {variant.stock}</p>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex items-center border border-border">
                <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Kurangi">−</button>
                <span className="min-w-10 px-3 text-center text-sm">{qty}</span>
                <button className="px-3 py-2" onClick={() => setQty(qty + 1)} aria-label="Tambah">+</button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => handleAdd(false)} disabled={m.isPending} className="rounded-none">
                <ShoppingBag className="mr-2 h-4 w-4" /> Tambah ke Keranjang
              </Button>
              <Button onClick={() => handleAdd(true)} disabled={m.isPending} variant="outline" className="rounded-none">
                Beli Sekarang
              </Button>
              <Button variant="ghost" size="icon" aria-label="Wishlist" className="rounded-none">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {product.description && (
              <div className="mt-10 border-t border-border pt-6">
                <h3 className="font-display text-lg text-foreground">Deskripsi</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
            {product.specification && (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-display text-lg text-foreground">Spesifikasi</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{product.specification}</p>
              </div>
            )}
            <div className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
              Berat pengiriman ± {product.weight_gram} gram · Pengiriman dari Pekalongan.
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <div className="border-t border-border pt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Produk Lainnya</p>
              <h2 className="mt-2 font-display text-2xl text-foreground">Anda mungkin juga suka</h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
              {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}