import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureCart(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (data) return data.id;
  const { data: c, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return c.id;
}

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const { data: cart } = await supabase
      .from("carts")
      .select("id, voucher_code, notes")
      .eq("id", cartId)
      .single();
    const { data: items } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, product_id, variant_id, products(id, name, slug, price, discount_price, product_images(url, sort_order)), product_variants(id, size, color, stock, price_override)",
      )
      .eq("cart_id", cartId)
      .order("created_at");
    return { cart, items: items ?? [] };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; variantId?: string | null; quantity?: number }) =>
    z
      .object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(99).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const qty = data.quantity ?? 1;
    const variantId = data.variantId ?? null;

    const { data: dupRows } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", data.productId);
    const dup = (dupRows ?? []).find(
      (r: any) => (r.variant_id ?? null) === variantId || (!r.variant_id && !variantId),
    );

    if (dup) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: dup.quantity + qty })
        .eq("id", dup.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: data.productId,
          variant_id: variantId,
          quantity: qty,
        });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string; quantity: number }) =>
    z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_items")
      .update({ quantity: data.quantity })
      .eq("id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string }) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cart_items").delete().eq("id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCartMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { voucherCode?: string | null; notes?: string | null }) =>
    z
      .object({
        voucherCode: z.string().max(40).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const patch: { voucher_code?: string | null; notes?: string | null } = {};
    if (data.voucherCode !== undefined) patch.voucher_code = data.voucherCode;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await supabase.from("carts").update(patch).eq("id", cartId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
