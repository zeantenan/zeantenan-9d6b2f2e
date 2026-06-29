import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getCart } from "@/lib/cart.functions";
import { listAddresses } from "@/lib/account.functions";
import { placeOrder } from "@/lib/orders.functions";
import { formatIDR } from "@/lib/format";
import { RegionSelects } from "@/components/region/RegionSelects";
import type { CartItem, Address } from "@/lib/types";

const cartQO = queryOptions({ queryKey: ["cart"], queryFn: () => getCart() });
const addrQO = queryOptions({ queryKey: ["addresses"], queryFn: () => listAddresses() });

const COURIERS = [
  { value: "jne|REG", label: "JNE REG (2–3 hari)", cost: 25000 },
  { value: "jne|YES", label: "JNE YES (1–2 hari)", cost: 38000 },
  { value: "jnt|REG", label: "J&T Reguler (2–3 hari)", cost: 24000 },
  { value: "sicepat|REG", label: "SiCepat REG (2–3 hari)", cost: 23000 },
  { value: "anteraja|REG", label: "AnterAja Reguler", cost: 22000 },
];

const BANKS = [
  { value: "BCA", label: "BCA — 1234567890 a.n. ZEAN TENAN" },
  { value: "Mandiri", label: "Mandiri — 9876543210 a.n. ZEAN TENAN" },
  { value: "BNI", label: "BNI — 2468013579 a.n. ZEAN TENAN" },
];

const schema = z.object({
  recipient_name: z.string().trim().min(2).max(120),
  recipient_phone: z.string().trim().min(8).max(20),
  province: z.string().trim().min(2),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  village: z.string().trim().max(80).optional(),
  postal_code: z.string().trim().min(4).max(10),
  full_address: z.string().trim().min(5).max(500),
  courier_combo: z.string().min(3),
  bank_name: z.string().min(2),
  notes: z.string().max(500).optional(),
  agreed: z.boolean().refine((v) => v === true, { message: "Anda harus menyetujui ketentuan" }),
});

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ZEAN TENAN" },
      {
        name: "description",
        content:
          "Selesaikan pesanan gamis dan daster original ZEAN TENAN Anda. Pembayaran via transfer bank.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { data: cart } = useSuspenseQuery(cartQO);
  const { data: addresses } = useSuspenseQuery(addrQO);
  const navigate = useNavigate();
  const place = useServerFn(placeOrder);

  const items = (cart.items ?? []) as CartItem[];
  const subtotal = items.reduce((acc, it) => {
    const price = Number(
      it.product_variants?.price_override ?? it.products?.discount_price ?? it.products?.price ?? 0,
    );
    return acc + price * it.quantity;
  }, 0);

  const defaultAddr =
    (addresses as Address[]).find((a) => a.is_default) ?? (addresses as Address[])[0];
  const [usingAddrId, setUsingAddrId] = useState<string | null>(defaultAddr?.id ?? null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient_name: defaultAddr?.recipient_name ?? "",
      recipient_phone: defaultAddr?.phone ?? "",
      province: defaultAddr?.province ?? "",
      city: defaultAddr?.city ?? "",
      district: defaultAddr?.district ?? "",
      village: defaultAddr?.village ?? "",
      postal_code: defaultAddr?.postal_code ?? "",
      full_address: defaultAddr?.full_address ?? "",
      courier_combo: COURIERS[0].value,
      bank_name: BANKS[0].value,
      notes: "",
      agreed: false,
    },
  });

  const courierCombo = form.watch("courier_combo");
  const shipping = COURIERS.find((c) => c.value === courierCombo)?.cost ?? 0;
  const total = subtotal + shipping;

  function pickAddress(id: string) {
    const a = (addresses as Address[]).find((x) => x.id === id);
    if (!a) return;
    setUsingAddrId(id);
    form.reset({
      ...form.getValues(),
      recipient_name: a.recipient_name,
      recipient_phone: a.phone,
      province: a.province,
      city: a.city,
      district: a.district,
      village: a.village ?? "",
      postal_code: a.postal_code,
      full_address: a.full_address,
    });
  }

  const m = useMutation({
    mutationFn: place,
    onSuccess: (res: { order_number: string }) => {
      toast.success("Pesanan berhasil dibuat", {
        description: `Nomor pesanan: ${res.order_number}`,
      });
      navigate({ to: "/pesanan/$orderNumber", params: { orderNumber: res.order_number } });
    },
    onError: (e: Error) => toast.error("Gagal membuat pesanan", { description: e.message }),
  });

  function onSubmit(values: z.infer<typeof schema>) {
    const [courier, service] = values.courier_combo.split("|");
    m.mutate({
      data: {
        recipient_name: values.recipient_name,
        recipient_phone: values.recipient_phone,
        province: values.province,
        city: values.city,
        district: values.district,
        village: values.village || null,
        postal_code: values.postal_code,
        full_address: values.full_address,
        courier,
        courier_service: service,
        shipping_cost: shipping,
        bank_name: values.bank_name,
        notes: values.notes || null,
        agreed: true as const,
      },
    });
  }

  if (items.length === 0) {
    return (
      <AccountLayout title="Checkout">
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Keranjang Anda kosong.
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="Checkout" description="Lengkapi alamat pengiriman dan pilih kurir Anda.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <FormProvider {...form}>
          <div className="space-y-10">
            {addresses.length > 0 && (
              <section>
                <h3 className="font-display text-lg">Pilih dari Alamat Tersimpan</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(addresses as Address[]).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => pickAddress(a.id)}
                      className={`border p-4 text-left text-xs ${usingAddrId === a.id ? "border-primary" : "border-border hover:border-foreground"}`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {a.recipient_name} · {a.phone}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {a.full_address}, {a.district}, {a.city}, {a.province} {a.postal_code}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-display text-lg">Informasi Penerima</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nama Penerima" error={form.formState.errors.recipient_name?.message}>
                  <Input className="rounded-none" {...form.register("recipient_name")} />
                </Field>
                <Field label="No. Telepon" error={form.formState.errors.recipient_phone?.message}>
                  <Input className="rounded-none" {...form.register("recipient_phone")} />
                </Field>
                <div className="sm:col-span-2">
                  <RegionSelects />
                </div>
              </div>
              <Field
                label="Alamat Lengkap"
                className="mt-4"
                error={form.formState.errors.full_address?.message}
              >
                <Textarea rows={3} className="rounded-none" {...form.register("full_address")} />
              </Field>
            </section>

            <section>
              <h3 className="font-display text-lg">Pengiriman</h3>
              <Field label="Kurir & Layanan" className="mt-4">
                <Select
                  value={courierCombo}
                  onValueChange={(v) => form.setValue("courier_combo", v)}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURIERS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label} — {formatIDR(c.cost)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </section>

            <section>
              <h3 className="font-display text-lg">Pembayaran</h3>
              <Field label="Transfer Bank" className="mt-4">
                <Select
                  value={form.watch("bank_name")}
                  onValueChange={(v) => form.setValue("bank_name", v)}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">
                Setelah pesanan dibuat Anda akan diarahkan ke halaman pembayaran untuk mengunggah
                bukti transfer.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg">Catatan</h3>
              <Textarea
                rows={3}
                className="mt-2 rounded-none"
                placeholder="Catatan opsional untuk penjual…"
                {...form.register("notes")}
              />
            </section>

            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={form.watch("agreed")}
                onCheckedChange={(v) => form.setValue("agreed", Boolean(v))}
                className="mt-0.5 rounded-none"
              />
              <span className="text-muted-foreground">
                Saya menyetujui syarat &amp; ketentuan pemesanan ZEAN TENAN dan kebijakan
                pengiriman.
              </span>
            </label>
            {form.formState.errors.agreed && (
              <p className="text-xs text-destructive">{form.formState.errors.agreed.message}</p>
            )}
          </div>

          <aside className="h-fit border border-border p-6">
            <h3 className="font-display text-xl text-foreground">Ringkasan</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((it) => {
                const price = Number(
                  it.product_variants?.price_override ??
                    it.products?.discount_price ??
                    it.products?.price ??
                    0,
                );
                return (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span className="flex-1 text-muted-foreground">
                      {it.products?.name} × {it.quantity}
                    </span>
                    <span className="text-foreground">{formatIDR(price * it.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatIDR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ongkir</dt>
                <dd>{formatIDR(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt>Total</dt>
                <dd className="font-medium text-foreground">{formatIDR(total)}</dd>
              </div>
            </dl>
            <Button type="submit" disabled={m.isPending} className="mt-6 w-full rounded-none">
              {m.isPending ? "Memproses pesanan..." : "Buat Pesanan"}
            </Button>
          </aside>
        </FormProvider>
      </form>
    </AccountLayout>
  );
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
