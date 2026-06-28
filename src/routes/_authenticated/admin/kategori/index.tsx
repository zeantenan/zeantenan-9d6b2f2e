import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/kategori/")({
  head: () => ({ meta: [{ title: "Kategori — Admin ZEAN TENAN" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQO),
  component: KategoriPage,
});

const categoriesQO = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: () => adminListCategories(),
});

type Category = Awaited<ReturnType<typeof adminListCategories>>[number];

function KategoriPage() {
  const qc = useQueryClient();
  const { data: categories, refetch } = useSuspenseQuery(categoriesQO);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "0",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ name: "", slug: "", description: "", sort_order: "0", is_active: true });
    setShowForm(false);
    setEditingId(null);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      sort_order: String(cat.sort_order),
      is_active: cat.is_active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Nama kategori wajib diisi");
    if (!form.slug.trim()) return toast.error("Slug wajib diisi");
    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateCategory({
          data: {
            id: editingId,
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            sort_order: Number(form.sort_order),
            is_active: form.is_active,
          },
        });
        toast.success("Kategori berhasil diperbarui");
      } else {
        await adminCreateCategory({
          data: {
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            sort_order: Number(form.sort_order),
            is_active: form.is_active,
          },
        });
        toast.success("Kategori berhasil ditambahkan");
      }
      resetForm();
      refetch();
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      toast.error(editingId ? "Gagal memperbarui kategori" : "Gagal menambahkan kategori");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus kategori "${name}"? Produk dalam kategori ini tidak akan terhapus.`)) return;
    try {
      await adminDeleteCategory({ data: { id } });
      toast.success(`Kategori "${name}" berhasil dihapus`);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      await adminUpdateCategory({
        data: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sort_order: cat.sort_order,
          is_active: !cat.is_active,
        },
      });
      toast.success(cat.is_active ? "Kategori dinonaktifkan" : "Kategori diaktifkan");
      refetch();
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      toast.error("Gagal mengubah status kategori");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Kategori</h1>
          <p className="mt-1 text-sm text-muted-foreground">{categories.length} total kategori</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Tambah Kategori
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {editingId ? "Edit Kategori" : "Kategori Baru"}
            </h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nama *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : (f.slug || autoSlug(e.target.value)) }))}
                className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Gamis Batik"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs"
                placeholder="gamis-batik"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Urutan</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                min="0"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground">Aktif</span>
              </label>
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-muted-foreground">Deskripsi</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Deskripsi kategori (opsional)"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-none border border-input bg-background px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Deskripsi</th>
              <th className="px-4 py-3 font-medium">Urutan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {cat.description || "-"}
                </td>
                <td className="px-4 py-3 text-foreground">{cat.sort_order}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`inline-flex items-center gap-1 rounded-none border px-2 py-0.5 text-xs uppercase transition-colors ${
                      cat.is_active
                        ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        : "border-muted bg-transparent text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {cat.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="rounded-none p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="rounded-none p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Belum ada kategori. Klik 'Tambah Kategori' untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
