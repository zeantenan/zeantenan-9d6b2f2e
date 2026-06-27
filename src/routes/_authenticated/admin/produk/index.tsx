import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { adminListProducts, adminDeleteProduct } from "@/lib/admin.functions";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produk/")({
  head: () => ({ meta: [{ title: "Produk — Admin ZEAN TENAN" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: ProductListPage,
});

const productsQO = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: () => adminListProducts({}),
});

function ProductListPage() {
  const { data: products, refetch } = useSuspenseQuery(productsQO);
  const [filter, setFilter] = useState<string>("");
  const [q, setQ] = useState("");

  const filtered = products.filter((p) => {
    if (filter && p.status !== filter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    try {
      await adminDeleteProduct({ id });
      toast.success(`Produk "${name}" berhasil dihapus`);
      refetch();
    } catch {
      toast.error("Gagal menghapus produk");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Produk</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} total produk</p>
        </div>
        <Link
          to="/admin/produk/tambah"
          className="inline-flex items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk..."
            className="w-full rounded-none border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Semua status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.categories?.name ?? "-"}</td>
                <td className="px-4 py-3 text-foreground">{formatIDR(Number(p.price))}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs uppercase ${
                      p.status === "published"
                        ? "text-green-600"
                        : p.status === "draft"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {p.status === "published" ? (
                      <Eye className="h-3 w-3" />
                    ) : p.status === "draft" ? (
                      <EyeOff className="h-3 w-3" />
                    ) : null}
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      to="/admin/produk/$slug/edit"
                      params={{ slug: p.slug }}
                      className="rounded-none p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="rounded-none p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {products.length === 0
                    ? "Belum ada produk. Klik 'Tambah Produk' untuk memulai."
                    : "Tidak ada produk yang cocok dengan filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
