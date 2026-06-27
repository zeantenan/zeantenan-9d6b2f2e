import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { listOrders } from "@/lib/orders.functions";
import { formatIDR, formatDateID, ORDER_STATUS_LABEL } from "@/lib/format";

const qo = queryOptions({ queryKey: ["orders"], queryFn: () => listOrders() });

export const Route = createFileRoute("/_authenticated/pesanan/")({
  head: () => ({ meta: [
    { title: "Riwayat Pesanan — ZEAN TENAN" },
    { name: "description", content: "Pantau semua pesanan gamis dan daster original ZEAN TENAN Anda di satu tempat." },
  ] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data } = useSuspenseQuery(qo);
  return (
    <AccountLayout title="Riwayat Pesanan" description="Pantau semua pesanan Anda di satu tempat.">
      {data.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Anda belum memiliki pesanan. <Link to="/produk" className="text-primary underline">Mulai belanja</Link>
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {data.map((o: any) => (
            <Link
              key={o.id}
              to="/pesanan/$orderNumber"
              params={{ orderNumber: o.order_number }}
              className="flex flex-wrap items-center justify-between gap-4 py-5 transition-colors hover:bg-secondary/50"
            >
              <div>
                <p className="font-mono text-sm text-foreground">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{formatDateID(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{formatIDR(o.total)}</p>
                <p className="text-xs uppercase tracking-[0.15em] text-primary">{ORDER_STATUS_LABEL[o.status]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}