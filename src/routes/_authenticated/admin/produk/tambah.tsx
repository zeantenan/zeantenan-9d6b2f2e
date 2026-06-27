import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { adminCreateProduct, adminListCategories } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/produk/tambah")({
  head: () => ({ meta: [{ title: "Tambah Produk — Admin ZEAN TENAN" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQO),
  component: TambahProdukPage,
});

const categoriesQO = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: () => adminListCategories(),
});

function TambahProdukPage() {
  const navigate = useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category_id: "",
    short_description: "",
    description: "",
    specification: "",
    price: "",
    discount_price: "",
    weight_gram: "500",
    status: "draft",
    seo_title: "",
    seo_description: "",
  });
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);
  const [variants, setVariants] = useState<
    { size: string; color: string; stock: string; price_override: string }[]
  >([]);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(v: string) {
    setForm((f) => ({ ...f, name: v, slug: f.slug || autoSlug(v) }));
  }

  function addImage() {
    if (!imgUrl.trim()) return;
    setImages((prev) => [...prev, { url: imgUrl.trim(), alt: imgAlt }]);
    setImgUrl("");
    setImgAlt("");
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { size: "", color: "", stock: "0", price_override: "" }]);
  }

  function updateVariant(i: number, field: string, value: string) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama produk wajib diisi");
    if (!form.slug.trim()) return toast.error("Slug wajib diisi");
    if (!form.price || Number(form.price) <= 0) return toast.error("Harga harus lebih dari 0");

    setSaving(true);
    try {
      await adminCreateProduct({
        name: form.name.trim(),
        slug: form.slug.trim(),
        category_id: form.category_id || null,
        short_description: form.short_description || null,
        description: form.description || null,
        specification: form.specification || null,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        weight_gram: Number(form.weight_gram),
        status: form.status as Database["public"]["Enums"]["product_status"],
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        images: images.map((img, i) => ({ url: img.url, alt: img.alt || null, sort_order: i })),
        variants: variants.map((v) => ({
          size: v.size || null,
          color: v.color || null,
          stock: Number(v.stock),
          price_override: v.price_override ? Number(v.price_override) : null,
        })),
      });
      toast.success("Produk berhasil dibuat");
      navigate({ to: "/admin/produk" });
    } catch {
      toast.error("Gagal membuat produk");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-foreground">Tambah Produk</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lengkapi informasi produk baru.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Section title="Informasi Dasar">
          <Field label="Nama Produk" required>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              placeholder="Gamis Batik Modern"
            />
          </Field>
          <Field label="Slug" required>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs"
              placeholder="gamis-batik-modern"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <select
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>
          <Field label="Deskripsi Singkat">
            <textarea
              value={form.short_description}
              onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              rows={2}
              placeholder="Tampil di kartu produk..."
            />
          </Field>
          <Field label="Deskripsi Lengkap">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              rows={5}
              placeholder="Deskripsi detail produk..."
            />
          </Field>
          <Field label="Spesifikasi">
            <textarea
              value={form.specification}
              onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono text-xs"
              rows={4}
              placeholder="Bahan: Katun&#10;Ukuran: M, L, XL&#10;Warna: Navy, Maroon"
            />
          </Field>
        </Section>

        <Section title="Harga & Berat">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Harga" required>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
                placeholder="150000"
                min="0"
              />
            </Field>
            <Field label="Harga Diskon">
              <input
                type="number"
                value={form.discount_price}
                onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
                placeholder="125000"
                min="0"
              />
            </Field>
            <Field label="Berat (gram)" required>
              <input
                type="number"
                value={form.weight_gram}
                onChange={(e) => setForm((f) => ({ ...f, weight_gram: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
                placeholder="500"
                min="1"
              />
            </Field>
          </div>
        </Section>

        <Section title="Gambar Produk">
          <div className="flex gap-2">
            <input
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary flex-1"
              placeholder="https://..."
            />
            <input
              value={imgAlt}
              onChange={(e) => setImgAlt(e.target.value)}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-40"
              placeholder="Alt text"
            />
            <button
              type="button"
              onClick={addImage}
              className="rounded-none bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="group relative border border-border p-1">
                  <img src={img.url} alt={img.alt} className="h-16 w-16 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-destructive text-destructive-foreground text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Varian (Ukuran / Warna)">
          {variants.map((v, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-end border border-border p-3">
              <Field label="Ukuran">
                <input
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                  className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-24"
                  placeholder="M"
                />
              </Field>
              <Field label="Warna">
                <input
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                  className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-28"
                  placeholder="Navy"
                />
              </Field>
              <Field label="Stok">
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, "stock", e.target.value)}
                  className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-20"
                  min="0"
                />
              </Field>
              <Field label="Harga Khusus">
                <input
                  type="number"
                  value={v.price_override}
                  onChange={(e) => updateVariant(i, "price_override", e.target.value)}
                  className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-28"
                  placeholder="Kosongi"
                  min="0"
                />
              </Field>
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="mb-1 rounded-none bg-destructive/10 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/20"
              >
                Hapus
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-2 rounded-none border border-dashed border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Tambah Varian
          </button>
        </Section>

        <Section title="SEO">
          <Field label="Judul SEO">
            <input
              value={form.seo_title}
              onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              placeholder="Gamis Batik Modern - ZEAN TENAN"
            />
          </Field>
          <Field label="Deskripsi SEO">
            <textarea
              value={form.seo_description}
              onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              rows={2}
              placeholder="Beli gamis batik modern..."
            />
          </Field>
        </Section>

        <div className="flex gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-none bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/produk" })}
            className="rounded-none border border-input bg-background px-6 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-border p-5">
      <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}
