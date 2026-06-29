import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
  address_id: z.string().uuid().optional(),
  recipient_name: z.string().trim().min(2).max(120),
  recipient_phone: z.string().trim().min(8).max(20),
  province: z.string().trim().min(2),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  village: z.string().trim().max(80).optional().nullable(),
  postal_code: z.string().trim().min(4).max(10),
  full_address: z.string().trim().min(5).max(500),
  courier: z.string().trim().min(2),
  courier_service: z.string().trim().min(1),
  shipping_cost: z.number().int().min(0).max(10_000_000),
  bank_name: z.string().trim().min(2).max(60),
  notes: z.string().max(500).optional().nullable(),
  agreed: z.literal(true),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load cart
    const { data: cart } = await supabase
      .from("carts")
      .select("id, voucher_code")
      .eq("user_id", userId)
      .maybeSingle();
    if (!cart) throw new Error("Keranjang Anda kosong.");
    const { data: items } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, product_id, variant_id, products(name, price, discount_price, product_images(url, sort_order)), product_variants(size, color, price_override, stock)",
      )
      .eq("cart_id", cart.id);
    if (!items || items.length === 0) throw new Error("Keranjang Anda kosong.");

    let subtotal = 0;
    type CartItemRow = {
      id: string;
      quantity: number;
      product_id: string;
      variant_id: string | null;
      products: {
        name: string;
        price: number;
        discount_price: number | null;
        product_images: { url: string; sort_order: number }[];
      } | null;
      product_variants: {
        size: string | null;
        color: string | null;
        price_override: number | null;
        stock: number;
      } | null;
    };
    const orderItems = (items as CartItemRow[]).map((it) => {
      const unit = Number(
        it.product_variants?.price_override ??
          it.products?.discount_price ??
          it.products?.price ??
          0,
      );
      const lineSub = unit * it.quantity;
      subtotal += lineSub;
      const variantLabel =
        [it.product_variants?.size, it.product_variants?.color].filter(Boolean).join(" / ") || null;
      const image =
        (it.products?.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]
          ?.url ?? null;
      return {
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.products?.name ?? "Produk",
        variant_label: variantLabel,
        image_url: image,
        unit_price: unit,
        quantity: it.quantity,
        subtotal: lineSub,
      };
    });

    const discount = 0;
    const total = subtotal + data.shipping_cost - discount;

    const now = new Date();
    const orderNumber = `ZTN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase().padStart(6, "0")}`;

    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: order, error: ordErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: "menunggu_pembayaran",
        subtotal,
        shipping_cost: data.shipping_cost,
        discount,
        total,
        voucher_code: cart.voucher_code,
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        ship_province: data.province,
        ship_city: data.city,
        ship_district: data.district,
        ship_village: data.village ?? null,
        ship_postal_code: data.postal_code,
        ship_full_address: data.full_address,
        courier: data.courier,
        courier_service: data.courier_service,
        notes: data.notes ?? null,
        bank_name: data.bank_name,
        payment_deadline: deadline.toISOString(),
      })
      .select("id, order_number")
      .single();
    if (ordErr) throw new Error(ordErr.message);

    const { error: oiErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (oiErr) throw new Error(oiErr.message);

    await Promise.all([
      supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "menunggu_pembayaran",
        notes: "Pesanan dibuat, menunggu pembayaran.",
        changed_by: userId,
      }),
      supabase.from("cart_items").delete().eq("cart_id", cart.id),
      supabase.from("carts").update({ voucher_code: null, notes: null }).eq("id", cart.id),
    ]);

    return { order_number: order.order_number };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, total, created_at, payment_deadline")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderNumber: string }) =>
    z.object({ orderNumber: z.string().min(3).max(40) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", data.orderNumber)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    const { data: history } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at");
    const { data: proofs } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    return { order, items: items ?? [], history: history ?? [], proofs: proofs ?? [] };
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      orderId: string;
      filePath: string;
      bankName: string;
      senderName: string;
      amount: number;
      transferredAt: string;
    }) =>
      z
        .object({
          orderId: z.string().uuid(),
          filePath: z.string().min(3),
          bankName: z.string().trim().min(2).max(60),
          senderName: z.string().trim().min(2).max(120),
          amount: z.number().min(0),
          transferredAt: z.string(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ensure order belongs to user
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Pesanan tidak ditemukan.");

    const { error: ppErr } = await supabase.from("payment_proofs").insert({
      order_id: data.orderId,
      file_path: data.filePath,
      bank_name: data.bankName,
      sender_name: data.senderName,
      amount: data.amount,
      transferred_at: data.transferredAt,
      status: "menunggu",
    });
    if (ppErr) throw new Error(ppErr.message);

    await supabase.from("orders").update({ status: "menunggu_verifikasi" }).eq("id", data.orderId);
    await supabase.from("order_status_history").insert({
      order_id: data.orderId,
      status: "menunggu_verifikasi",
      notes: "Bukti pembayaran diunggah, menunggu verifikasi admin.",
      changed_by: userId,
    });
    return { ok: true };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; reason?: string }) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().max(300).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (!["menunggu_pembayaran", "menunggu_verifikasi"].includes(order.status))
      throw new Error("Pesanan tidak dapat dibatalkan pada status ini.");
    await supabase
      .from("orders")
      .update({ status: "dibatalkan", cancelled_reason: data.reason ?? null })
      .eq("id", data.orderId);
    await supabase.from("order_status_history").insert({
      order_id: data.orderId,
      status: "dibatalkan",
      notes: data.reason ?? "Dibatalkan oleh pembeli.",
      changed_by: userId,
    });
    return { ok: true };
  });
