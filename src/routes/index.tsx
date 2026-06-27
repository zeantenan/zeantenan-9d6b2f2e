import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { listProducts, listCategories } from "@/lib/products.functions";
import { formatIDR } from "@/lib/format";
import { publicMediaUrl } from "@/lib/storage";

const productsQO = queryOptions({
  queryKey: ["home", "products"],
  queryFn: () => listProducts({ data: { limit: 8 } }),
});
const categoriesQO = queryOptions({
  queryKey: ["home", "categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZEAN TENAN — Original Gamis & Daster dari Kota Batik Indonesia" },
      {
        name: "description",
        content:
          "Belanja gamis dan daster original dari Pekalongan. Kualitas premium, motif batik khas, langsung dari pengrajin Kota Batik Indonesia.",
      },
      {
        property: "og:title",
        content: "ZEAN TENAN — Original Gamis & Daster dari Kota Batik Indonesia",
      },
      {
        property: "og:description",
        content:
          "Original Gamis & Daster dari Kota Batik Indonesia. Kualitas premium, motif batik khas Pekalongan.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQO);
    context.queryClient.ensureQueryData(categoriesQO);
  },
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 py-16 sm:px-6 md:grid-cols-12 md:py-24 lg:px-8">
          <div className="md:col-span-7">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Edisi Baru · 2026
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
              Gamis &amp; Daster
              <br />
              dari Kota Batik <span className="text-primary">Indonesia.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground">
              Setiap helai dijahit dengan tangan oleh pengrajin Pekalongan. Motif klasik, bahan
              adem, dan kenyamanan setiap hari — original karya ZEAN TENAN.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none">
                <Link to="/produk">
                  Jelajahi Katalog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-none">
                <Link to="/kategori/gamis">Lihat Gamis</Link>
              </Button>
            </div>
          </div>
          <div className="md:col-span-5">
            <div
              className="aspect-[4/5] w-full border border-border bg-secondary"
              aria-hidden="true"
            >
              <div className="flex h-full items-center justify-center p-10">
                <span className="font-display text-2xl text-muted-foreground">ZEAN · TENAN</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div>01 — Original</div>
              <div>02 — Pekalongan</div>
              <div className="text-right">03 — 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader index="01" title="Kategori" subtitle="Pilih gaya yang sesuai" />
            <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/kategori/$slug"
                  params={{ slug: c.slug }}
                  className="group flex flex-col justify-between bg-background p-8 transition-colors hover:bg-secondary"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Kategori
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-foreground">{c.name}</h3>
                    {c.description && (
                      <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <span className="mt-6 inline-flex items-center text-sm text-primary">
                    Lihat koleksi{" "}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            index={categories.length > 0 ? "02" : "01"}
            title="Pilihan Terbaru"
            subtitle="Koleksi yang baru tiba di etalase"
          />
          {products.length === 0 ? (
            <div className="mt-10 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Produk akan segera ditambahkan oleh admin.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline" className="rounded-none">
              <Link to="/produk">Lihat seluruh katalog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            <Promise
              n="01"
              title="Original Pekalongan"
              body="Diproduksi langsung di sentra batik Pekalongan dengan motif eksklusif."
            />
            <Promise
              n="02"
              title="Bahan Adem &amp; Nyaman"
              body="Pemilihan kain teliti agar nyaman dipakai sepanjang hari."
            />
            <Promise
              n="03"
              title="Dukungan Penuh"
              body="Tim kami siap membantu via WhatsApp untuk setiap pertanyaan."
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{index}</p>
        <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Promise({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border-t border-foreground/80 pt-6">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{n}</p>
      <h3
        className="mt-3 font-display text-xl text-foreground"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function ProductCard({ product }: { product: any }) {
  const image = (product.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url;
  const hasDiscount =
    product.discount_price &&
    Number(product.discount_price) > 0 &&
    Number(product.discount_price) < Number(product.price);
  return (
    <Link to="/produk/$slug" params={{ slug: product.slug }} className="group block">
      <div className="aspect-[4/5] w-full overflow-hidden border border-border bg-secondary">
        {image ? (
          <img
            src={publicMediaUrl(image)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            ZEAN · TENAN
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm text-foreground">
            {formatIDR(hasDiscount ? product.discount_price : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatIDR(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
