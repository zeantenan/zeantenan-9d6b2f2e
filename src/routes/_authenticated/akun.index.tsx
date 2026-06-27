import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { getProfile } from "@/lib/account.functions";
import { listOrders } from "@/lib/orders.functions";
import { formatIDR, formatDateID, ORDER_STATUS_LABEL } from "@/lib/format";

const pQO = queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });
const oQO = queryOptions({ queryKey: ["orders"], queryFn: () => listOrders() });

export const Route = createFileRoute("/_authenticated/akun/")({
  head: () => ({
    meta: [
      { title: "Dasbor Akun — ZEAN TENAN" },
      {
        name: "description",
        content:
          "Kelola akun, pantau pesanan, dan simpan alamat untuk pengalaman belanja gamis & daster original yang lebih nyaman.",
      },
    ],
  }),
  component: AkunPage,
});

function AkunPage() {
  const { data: profile } = useSuspenseQuery(pQO);
  const { data: orders } = useSuspenseQuery(oQO);
  const recent = orders.slice(0, 4);

  return (
    <AccountLayout
      title={`Halo, ${profile?.full_name || "Pelanggan"}`}
      description="Pantau aktivitas akun dan pesanan Anda."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Pesanan" value={String(orders.length)} />
        <Stat
          label="Sedang Diproses"
          value={String(
            orders.filter((o: any) => !["selesai", "dibatalkan", "ditolak"].includes(o.status))
              .length,
          )}
        />
        <Stat
          label="Selesai"
          value={String(orders.filter((o: any) => o.status === "selesai").length)}
        />
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <h2 className="font-display text-xl">Pesanan Terbaru</h2>
          <Link to="/pesanan" className="text-xs text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Belum ada pesanan.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((o: any) => (
              <li key={o.id}>
                <Link
                  to="/pesanan/$orderNumber"
                  params={{ orderNumber: o.order_number }}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDateID(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{formatIDR(o.total)}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-primary">
                      {ORDER_STATUS_LABEL[o.status]}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
    </div>
  );
}
