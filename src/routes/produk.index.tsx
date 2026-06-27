import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard } from "./index";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/lib/products.functions";

const qo = (sort: string, q: string) =>
  queryOptions({
    queryKey: ["catalog", sort, q],
    queryFn: () => listProducts({ data: { sort: sort as any, q: q || undefined, limit: 48 } }),
  });

export const Route = createFileRoute("/produk/")({
  head: () => ({
    meta: [
      { title: "Katalog Produk — ZEAN TENAN" },
      { name: "description", content: "Jelajahi seluruh koleksi gamis dan daster original ZEAN TENAN dari Kota Batik Indonesia." },
      { property: "og:title", content: "Katalog Produk — ZEAN TENAN" },
      { property: "og:description", content: "Koleksi gamis & daster original dari Pekalongan." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo("newest", "")),
  component: CatalogPage,
});

function CatalogPage() {
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");
  const { data: products } = useSuspenseQuery(qo(sort, q));

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Katalog</p>
          <h1 className="mt-3 font-display text-4xl text-foreground">Seluruh Koleksi</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pilih dari koleksi gamis dan daster yang dibuat dengan ketelitian khas pengrajin Pekalongan.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Cari produk…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm rounded-none"
          />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full rounded-none sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="price_asc">Harga: Termurah</SelectItem>
              <SelectItem value="price_desc">Harga: Termahal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {products.length === 0 ? (
          <div className="mt-16 border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Belum ada produk yang sesuai pencarian Anda.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}