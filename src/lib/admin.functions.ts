import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error || !data) throw new Error("Forbidden: Hanya admin yang dapat mengakses");
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi").max(200),
  slug: z.string().trim().min(1, "Slug wajib diisi").max(200),
  category_id: z.string().uuid().nullable().optional(),
  short_description: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  specification: z.string().optional().nullable(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  discount_price: z.number().min(0).optional().nullable(),
  weight_gram: z.number().int().min(1, "Berat minimal 1 gram").default(500),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional().nullable(),
        sort_order: z.number().int().default(0),
      }),
    )
    .optional()
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        stock: z.number().int().min(0).default(0),
        min_stock: z.number().int().min(0).default(3),
        price_override: z.number().min(0).optional().nullable(),
        is_active: z.boolean().default(true),
      }),
    )
    .optional()
    .default([]),
});

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; q?: string } | undefined) =>
    z.object({ status: z.string().optional(), q: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    let q = sb
      .from("products")
      .select(
        "id, name, slug, price, discount_price, status, created_at, updated_at, categories(name)",
      )
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { data: product, error } = await sb
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name, slug)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createProductSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();

    const { images, variants, ...product } = data;
    const { data: newProd, error } = await sb
      .from("products")
      .insert({
        ...product,
        category_id: product.category_id || null,
        discount_price: product.discount_price || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    const productId = newProd.id;

    if (images.length) {
      const { error: imgErr } = await sb
        .from("product_images")
        .insert(images.map((img) => ({ ...img, product_id: productId })));
      if (imgErr) throw new Error(imgErr.message);
    }

    if (variants.length) {
      const { error: varErr } = await sb
        .from("product_variants")
        .insert(variants.map((v) => ({ ...v, product_id: productId })));
      if (varErr) throw new Error(varErr.message);
    }

    return { id: productId };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), ...createProductSchema.shape }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();

    const { id, images, variants, ...product } = data;
    const { error } = await sb
      .from("products")
      .update({
        ...product,
        category_id: product.category_id || null,
        discount_price: product.discount_price || null,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    if (images) {
      await sb.from("product_images").delete().eq("product_id", id);
      if (images.length) {
        const { error: imgErr } = await sb
          .from("product_images")
          .insert(images.map((img) => ({ ...img, product_id: id })));
        if (imgErr) throw new Error(imgErr.message);
      }
    }

    if (variants) {
      await sb.from("product_variants").delete().eq("product_id", id);
      if (variants.length) {
        const { error: varErr } = await sb
          .from("product_variants")
          .insert(variants.map((v) => ({ ...v, product_id: id })));
        if (varErr) throw new Error(varErr.message);
      }
    }

    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { data, error } = await sb.from("categories").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(100),
        slug: z.string().trim().min(1).max(100),
        description: z.string().max(500).optional().nullable(),
        image_url: z.string().optional().nullable(),
        sort_order: z.number().int().default(0),
        is_active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { id, ...fields } = data;
    const { error } = await sb.from("categories").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { error } = await sb.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        slug: z.string().trim().min(1).max(100),
        description: z.string().max(500).optional().nullable(),
        image_url: z.string().optional().nullable(),
        sort_order: z.number().int().default(0),
        is_active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const sb = await getAdmin();
    const { error } = await sb.from("categories").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
