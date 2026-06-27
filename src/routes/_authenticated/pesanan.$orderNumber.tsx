import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrder, submitPaymentProof, cancelOrder } from "@/lib/orders.functions";
import { formatIDR, formatDateID, ORDER_STATUS_LABEL, ORDER_STATUS_FLOW } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import type { OrderDetail, OrderItem, OrderHistoryItem } from "@/lib/types";

const qo = (n: string) =>
  queryOptions({ queryKey: ["order", n], queryFn: () => getOrder({ data: { orderNumber: n } }) });

export const Route = createFileRoute("/_authenticated/pesanan/$orderNumber")({
  loader: async ({ params, context }) => {
    const r = await context.queryClient.ensureQueryData(qo(params.orderNumber));
    if (!r) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `Pesanan ${params.orderNumber} — ZEAN TENAN` },
      {
        name: "description",
        content: `Detail pesanan ${params.orderNumber} — pantau status pengiriman gamis dan daster original ZEAN TENAN.`,
      },
    ],
  }),
  notFoundComponent: () => (
    <AccountLayout title="Pesanan tidak ditemukan">
      <p className="text-sm text-muted-foreground">
        Pesanan tidak ditemukan atau bukan milik akun Anda.
      </p>
    </AccountLayout>
  ),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderNumber } = Route.useParams();
  const { data } = useSuspenseQuery(qo(orderNumber));
  const qc = useQueryClient();
  const submit = useServerFn(submitPaymentProof);
  const cancel = useServerFn(cancelOrder);
  const [uploading, setUploading] = useState(false);

  const order = data!.order as OrderDetail;
  const items = data!.items as OrderItem[];
  const history = data!.history as OrderHistoryItem[];

  const subM = useMutation({
    mutationFn: submit,
    onSuccess: () => {
      toast.success("Bukti pembayaran terkirim", {
        description: "Tim kami akan segera memverifikasi.",
      });
      qc.invalidateQueries({ queryKey: ["order", orderNumber] });
    },
    onError: (e: Error) => toast.error("Gagal", { description: e.message }),
  });
  const cancelM = useMutation({
    mutationFn: cancel,
    onSuccess: () => {
      toast.success("Pesanan dibatalkan");
      qc.invalidateQueries({ queryKey: ["order", orderNumber] });
    },
  });

  async function handleUpload(form: HTMLFormElement) {
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;
    if (!file || file.size === 0) return toast.error("Pilih file bukti transfer");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran file maksimal 5 MB");
    setUploading(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      setUploading(false);
      return;
    }
    const path = `${userId}/${order.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setUploading(false);
      return toast.error("Gagal mengunggah", { description: upErr.message });
    }
    await subM.mutateAsync({
      data: {
        orderId: order.id,
        filePath: path,
        bankName: String(fd.get("bank") ?? order.bank_name ?? ""),
        senderName: String(fd.get("sender") ?? ""),
        amount: Number(fd.get("amount") ?? order.total),
        transferredAt: new Date(
          String(fd.get("transferred") || new Date().toISOString()),
        ).toISOString(),
      },
    });
    setUploading(false);
    form.reset();
  }

  const canPay = order.status === "menunggu_pembayaran";
  const canCancel = ["menunggu_pembayaran", "menunggu_verifikasi"].includes(order.status);

  return (
    <AccountLayout
      title={`Pesanan ${order.order_number}`}
      description={`Dibuat pada ${formatDateID(order.created_at)}`}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Timeline */}
          <section className="border border-border p-6">
            <h3 className="font-display text-lg">Status</h3>
            <ol className="mt-4 space-y-3">
              {ORDER_STATUS_FLOW.map((s, i) => {
                const reached =
                  ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]) >= i || order.status === "selesai";
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${reached ? "bg-primary" : "bg-border"}`}
                    />
                    <span className={reached ? "text-foreground" : "text-muted-foreground"}>
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                  </li>
                );
              })}
              {["dibatalkan", "ditolak"].includes(order.status) && (
                <li className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-destructive">{ORDER_STATUS_LABEL[order.status]}</span>
                </li>
              )}
            </ol>
            {order.tracking_number && (
              <p className="mt-4 text-xs text-muted-foreground">
                Nomor Resi:{" "}
                <span className="font-mono text-foreground">{order.tracking_number}</span>
              </p>
            )}
          </section>

          {/* Items */}
          <section className="border border-border">
            <div className="border-b border-border p-6">
              <h3 className="font-display text-lg">Item Pesanan</h3>
            </div>
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 p-6 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{it.product_name}</p>
                    {it.variant_label && (
                      <p className="text-xs text-muted-foreground">{it.variant_label}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {it.quantity} × {formatIDR(it.unit_price)}
                    </p>
                  </div>
                  <span className="text-foreground">{formatIDR(it.subtotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Payment */}
          {canPay && (
            <section className="border border-border p-6">
              <h3 className="font-display text-lg">Pembayaran</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Silakan transfer total{" "}
                <strong className="text-foreground">{formatIDR(order.total)}</strong> ke rekening
                <strong className="text-foreground"> {order.bank_name}</strong> atas nama ZEAN
                TENAN. Batas waktu pembayaran:
                <strong className="text-foreground"> {formatDateID(order.payment_deadline)}</strong>
                .
              </p>
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpload(e.currentTarget);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Bank Pengirim</Label>
                    <Input name="bank" className="rounded-none" required />
                  </div>
                  <div>
                    <Label>Nama Pengirim</Label>
                    <Input name="sender" className="rounded-none" required />
                  </div>
                  <div>
                    <Label>Jumlah Transfer (Rp)</Label>
                    <Input
                      name="amount"
                      type="number"
                      min={0}
                      className="rounded-none"
                      defaultValue={Number(order.total)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tanggal Transfer</Label>
                    <Input
                      name="transferred"
                      type="datetime-local"
                      className="rounded-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Bukti Transfer (JPG/PNG, maks 5 MB)</Label>
                  <Input
                    name="file"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="rounded-none"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading || subM.isPending}
                  className="rounded-none"
                >
                  Kirim Bukti Pembayaran
                </Button>
              </form>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section className="border border-border p-6">
              <h3 className="font-display text-lg">Riwayat</h3>
              <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
                {history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-4">
                    <span>
                      {ORDER_STATUS_LABEL[h.status]} — {h.notes ?? ""}
                    </span>
                    <span>{formatDateID(h.created_at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {canCancel && (
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() =>
                cancelM.mutate({ data: { orderId: order.id, reason: "Dibatalkan oleh pembeli" } })
              }
            >
              Batalkan Pesanan
            </Button>
          )}
        </div>

        <aside className="h-fit border border-border p-6 text-sm">
          <h3 className="font-display text-lg">Pengiriman</h3>
          <p className="mt-2 text-foreground">{order.recipient_name}</p>
          <p className="text-muted-foreground">{order.recipient_phone}</p>
          <p className="mt-3 text-muted-foreground">
            {order.ship_full_address}, {order.ship_district}, {order.ship_city},{" "}
            {order.ship_province} {order.ship_postal_code}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">Kurir</p>
          <p>
            {order.courier} · {order.courier_service}
          </p>

          <dl className="mt-6 space-y-1 border-t border-border pt-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatIDR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ongkir</dt>
              <dd>{formatIDR(order.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Diskon</dt>
              <dd>− {formatIDR(order.discount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt>Total</dt>
              <dd className="font-medium">{formatIDR(order.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </AccountLayout>
  );
}
