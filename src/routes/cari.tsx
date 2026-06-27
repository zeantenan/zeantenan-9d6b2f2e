import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { ProductCard } from "./index";
import { listProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/cari")({
  head: () => ({
    meta: [
      { title: "Cari Produk — ZEAN TENAN" },
      { name: "description", content: "Temukan gamis dan daster favorit Anda." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => listProducts({ data: { q: q || undefined, limit: 24 } }),
    enabled: q.length === 0 || q.length >= 2,
  });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pencarian</p>
        <h1 className="mt-3 font-display text-4xl text-foreground">Cari Produk</h1>
        <Input
          autoFocus
          placeholder="Ketik nama produk…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-6 max-w-xl rounded-none"
        />
        <div className="mt-8 text-xs text-muted-foreground">
          {isFetching ? "Mencari…" : data ? `${data.length} produk ditemukan` : ""}
        </div>
        {data && data.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {data.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}