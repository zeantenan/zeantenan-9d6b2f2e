import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator(
    (d: { q?: string; category?: string; sort?: string; limit?: number } | undefined) =>
      z
        .object({
          q: z.string().optional(),
          category: z.string().optional(),
          sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
          limit: z.number().int().min(1).max(60).optional(),
        })
        .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("products")
      .select(
        "id, name, slug, price, discount_price, short_description, product_images(url, sort_order), categories(name, slug)",
      )
      .eq("status", "published")
      .limit(data.limit ?? 24);

    if (data.q) q = q.ilike("name", `%${data.q}%`);
    if (data.category) {
      const { data: cat } = await sb
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (data.sort === "price_asc") q = q.order("price", { ascending: true });
    else if (data.sort === "price_desc") q = q.order("price", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select(
        "id, name, slug, description, short_description, specification, price, discount_price, weight_gram, seo_title, seo_description, product_images(url, alt, sort_order), product_variants(id, sku, size, color, stock, min_stock, price_override, is_active), categories(name, slug)",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;

    const { data: related } = await sb
      .from("products")
      .select("id, name, slug, price, discount_price, product_images(url)")
      .eq("status", "published")
      .neq("id", product.id)
      .limit(4);
    return { product, related: related ?? [] };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});
