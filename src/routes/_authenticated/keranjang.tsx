import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCart, updateCartItem, removeCartItem, updateCartMeta } from "@/lib/cart.functions";
import { formatIDR } from "@/lib/format";
import { publicMediaUrl } from "@/lib/storage";
import type { CartItem } from "@/lib/types";

const cartQO = queryOptions({ queryKey: ["cart"], queryFn: () => getCart() });

export const Route = createFileRoute("/_authenticated/keranjang")({
  head: () => ({
    meta: [
      { title: "Keranjang Belanja — ZEAN TENAN" },
      {
        name: "description",
        content:
          "Periksa keranjang belanja gamis dan daster original ZEAN TENAN Anda sebelum checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { data } = useSuspenseQuery(cartQO);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const upd = useServerFn(updateCartItem);
  const rm = useServerFn(removeCartItem);
  const meta = useServerFn(updateCartMeta);

  const updM = useMutation({
    mutationFn: upd,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const rmM = useMutation({
    mutationFn: rm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const metaM = useMutation({
    mutationFn: meta,
    onSuccess: () => toast.success("Catatan tersimpan"),
  });

  const items = (data.items ?? []) as CartItem[];
  const subtotal = items.reduce((acc, it) => {
    const price = Number(
      it.product_variants?.price_override ?? it.products?.discount_price ?? it.products?.price ?? 0,
    );
    return acc + price * it.quantity;
  }, 0);

  return (
    <AccountLayout
      title="Keranjang Belanja"
      description="Periksa kembali pesanan Anda sebelum melanjutkan ke pembayaran."
    >
      {items.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Keranjang Anda kosong.{" "}
          <Link to="/produk" className="ml-1 text-primary underline">
            Lihat katalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="divide-y divide-border border-y border-border">
            {items.map((it: any) => {
              const img = (it.products?.product_images ?? [])
                .slice()
                .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url;
              const price = Number(
                it.product_variants?.price_override ??
                  it.products?.discount_price ??
                  it.products?.price ??
                  0,
              );
              const variantLabel = [it.product_variants?.size, it.product_variants?.color]
                .filter(Boolean)
                .join(" / ");
              return (
                <div key={it.id} className="flex gap-4 py-6">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden border border-border bg-secondary">
                    {img && (
                      <img
                        src={publicMediaUrl(img)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        to="/produk/$slug"
                        params={{ slug: it.products?.slug }}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {it.products?.name}
                      </Link>
                      {variantLabel && (
                        <p className="text-xs text-muted-foreground">{variantLabel}</p>
                      )}
                      <p className="mt-1 text-sm text-foreground">{formatIDR(price)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="inline-flex items-center border border-border">
                        <button
                          className="px-3 py-1"
                          onClick={() =>
                            updM.mutate({
                              data: { itemId: it.id, quantity: Math.max(1, it.quantity - 1) },
                            })
                          }
                        >
                          −
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm">{it.quantity}</span>
                        <button
                          className="px-3 py-1"
                          onClick={() =>
                            updM.mutate({ data: { itemId: it.id, quantity: it.quantity + 1 } })
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => rmM.mutate({ data: { itemId: it.id } })}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium text-foreground">
                    {formatIDR(price * it.quantity)}
                  </div>
                </div>
              );
            })}

            <div className="space-y-3 py-6">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Kode Voucher
                </label>
                <div className="mt-1 flex gap-2">
                  <Input
                    className="rounded-none"
                    defaultValue={data.cart?.voucher_code ?? ""}
                    onBlur={(e) => metaM.mutate({ data: { voucherCode: e.target.value || null } })}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Voucher akan diterapkan saat checkout.
                </p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Catatan untuk Penjual
                </label>
                <Textarea
                  className="mt-1 rounded-none"
                  defaultValue={data.cart?.notes ?? ""}
                  onBlur={(e) => metaM.mutate({ data: { notes: e.target.value || null } })}
                />
              </div>
            </div>
          </div>

          <aside className="h-fit border border-border p-6">
            <h3 className="font-display text-xl text-foreground">Ringkasan</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatIDR(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Ongkos kirim</dt>
                <dd>Dihitung di checkout</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-border pt-4">
              <Button onClick={() => navigate({ to: "/checkout" })} className="w-full rounded-none">
                Lanjut ke Checkout
              </Button>
            </div>
          </aside>
        </div>
      )}
    </AccountLayout>
  );
}
