import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Package, Plus, TrendingUp, Eye } from "lucide-react";
import { adminListProducts, adminListCategories } from "@/lib/admin.functions";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin — ZEAN TENAN" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQO);
    context.queryClient.ensureQueryData(categoriesQO);
  },
  component: AdminDashboard,
});

const productsQO = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: () => adminListProducts({}),
});

const categoriesQO = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: () => adminListCategories(),
});

function AdminDashboard() {
  const { data: products } = useSuspenseQuery(productsQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);

  const published = products.filter((p) => p.status === "published").length;
  const drafts = products.filter((p) => p.status === "draft").length;
  const totalValue = products.reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola produk, kategori, dan konten toko Anda.</p>
        </div>
        <Link
          to="/admin/produk/tambah"
          className="inline-flex items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Produk" value={products.length} />
        <StatCard icon={Eye} label="Dipublikasikan" value={published} />
        <StatCard icon={TrendingUp} label="Draft" value={drafts} />
        <StatCard icon={TrendingUp} label="Total Nilai" value={formatIDR(totalValue)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Produk Terbaru</h2>
          <div className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to="/admin/produk/$slug/edit"
                params={{ slug: p.slug }}
                className="flex items-center justify-between border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary"
              >
                <div>
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className={`ml-2 text-xs uppercase ${p.status === "published" ? "text-green-600" : p.status === "draft" ? "text-amber-600" : "text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
                <span className="text-muted-foreground">{formatIDR(Number(p.price))}</span>
              </Link>
            ))}
            {products.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk. Mulai tambah produk baru!</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kategori</h2>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-border px-4 py-3 text-sm">
                <span className="text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.slug}</span>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada kategori.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
