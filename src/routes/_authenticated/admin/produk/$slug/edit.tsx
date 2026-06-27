import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { adminGetProduct, adminUpdateProduct, adminListCategories } from "@/lib/admin.functions";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produk/$slug/edit")({
  head: () => ({ meta: [{ title: "Edit Produk — Admin ZEAN TENAN" }] }),
  loader: async ({ params, context }) => {
    const products = await context.queryClient.fetchQuery(productsQO);
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw new Error("Produk tidak ditemukan");
    await context.queryClient.ensureQueryData(categoriesQO);
    await context.queryClient.ensureQueryData(productQO(params.slug));
  },
  component: EditProdukPage,
});

const productsQO = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: () => import("@/lib/admin.functions").then((m) => m.adminListProducts({})),
});

const categoriesQO = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: () => import("@/lib/admin.functions").then((m) => m.adminListCategories()),
});

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["admin", "product", slug],
    queryFn: async () => {
      const products = await import("@/lib/admin.functions").then((m) => m.adminListProducts({}));
      const p = products.find((pr) => pr.slug === slug);
      if (!p) throw new Error("Produk tidak ditemukan");
      return import("@/lib/admin.functions").then((m) => m.adminGetProduct({ id: p.id }));
    },
  });

function EditProdukPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { data: product } = useSuspenseQuery(productQO(slug));
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

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      category_id: product.category_id || "",
      short_description: product.short_description || "",
      description: product.description || "",
      specification: product.specification || "",
      price: String(product.price ?? ""),
      discount_price: product.discount_price ? String(product.discount_price) : "",
      weight_gram: String(product.weight_gram ?? "500"),
      status: product.status || "draft",
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
    });
    setImages(
      (product.product_images || []).map((img: Database["public"]["Tables"]["product_images"]["Row"]) => ({ url: img.url, alt: img.alt || "" })),
    );
    setVariants(
      (product.product_variants || []).map((v: Database["public"]["Tables"]["product_variants"]["Row"]) => ({
        size: v.size || "",
        color: v.color || "",
        stock: String(v.stock ?? "0"),
        price_override: v.price_override ? String(v.price_override) : "",
      })),
    );
  }, [product]);

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
    if (!form.price || Number(form.price) <= 0) return toast.error("Harga harus lebih dari 0");

    setSaving(true);
    try {
      await adminUpdateProduct({
        id: product!.id,
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
      toast.success("Produk berhasil diperbarui");
      navigate({ to: "/admin/produk" });
    } catch {
      toast.error("Gagal memperbarui produk");
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin/produk" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-foreground">Edit Produk</h1>
          <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Section title="Informasi Dasar">
          <Field label="Nama Produk" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
            />
          </Field>
          <Field label="Slug" required>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full font-mono text-xs"
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
            />
          </Field>
          <Field label="Deskripsi Lengkap">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              rows={5}
            />
          </Field>
          <Field label="Spesifikasi">
            <textarea
              value={form.specification}
              onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full font-mono text-xs"
              rows={4}
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
                min="0"
              />
            </Field>
            <Field label="Harga Diskon">
              <input
                type="number"
                value={form.discount_price}
                onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
                min="0"
              />
            </Field>
            <Field label="Berat (gram)" required>
              <input
                type="number"
                value={form.weight_gram}
                onChange={(e) => setForm((f) => ({ ...f, weight_gram: e.target.value }))}
                className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
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
                />
              </Field>
              <Field label="Warna">
                <input
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                  className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-28"
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
            />
          </Field>
          <Field label="Deskripsi SEO">
            <textarea
              value={form.seo_description}
              onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
              className="rounded-none border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary w-full"
              rows={2}
            />
          </Field>
        </Section>

        <div className="flex gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-none bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <Link
            to="/admin/produk"
            className="rounded-none border border-input bg-background px-6 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Batal
          </Link>
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
