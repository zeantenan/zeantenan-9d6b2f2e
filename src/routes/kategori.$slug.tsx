import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard } from "./index";
import { listProducts } from "@/lib/products.functions";

const qo = (slug: string) =>
  queryOptions({
    queryKey: ["catalog", "cat", slug],
    queryFn: () => listProducts({ data: { category: slug, limit: 48 } }),
  });

export const Route = createFileRoute("/kategori/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Kategori ${params.slug.replace(/-/g, " ")} — ZEAN TENAN` },
      {
        name: "description",
        content: `Koleksi ${params.slug.replace(/-/g, " ")} original ZEAN TENAN dari Kota Batik Indonesia. Gamis dan daster premium langsung dari Pekalongan.`,
      },
      { property: "og:title", content: `Kategori ${params.slug.replace(/-/g, " ")} — ZEAN TENAN` },
      {
        property: "og:description",
        content: `Koleksi ${params.slug.replace(/-/g, " ")} original dari Pekalongan.`,
      },
    ],
  }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(qo(params.slug)),
  component: CatPage,
});

function CatPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(qo(slug));
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Kategori</p>
        <h1 className="mt-3 font-display text-4xl capitalize text-foreground">
          {slug.replace(/-/g, " ")}
        </h1>
        {products.length === 0 ? (
          <div className="mt-16 border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Belum ada produk pada kategori ini.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
