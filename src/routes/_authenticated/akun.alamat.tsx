import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { listAddresses, upsertAddress, deleteAddress } from "@/lib/account.functions";

const qo = queryOptions({ queryKey: ["addresses"], queryFn: () => listAddresses() });

const schema = z.object({
  label: z.string().max(60).optional(),
  recipient_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  province: z.string().trim().min(2),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  village: z.string().trim().max(80).optional(),
  postal_code: z.string().trim().min(4).max(10),
  full_address: z.string().trim().min(5).max(500),
  is_default: z.boolean().optional(),
});

export const Route = createFileRoute("/_authenticated/akun/alamat")({
  head: () => ({ meta: [
    { title: "Buku Alamat — ZEAN TENAN" },
    { name: "description", content: "Kelola buku alamat untuk checkout gamis dan daster original ZEAN TENAN yang lebih cepat." },
  ] }),
  component: AlamatPage,
});

function AlamatPage() {
  const { data } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const upFn = useServerFn(upsertAddress);
  const delFn = useServerFn(deleteAddress);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const editAddr = data.find((a: any) => a.id === editing);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: {} as any });

  function openCreate() {
    setEditing(null);
    form.reset({ recipient_name: "", phone: "", province: "", city: "", district: "", village: "", postal_code: "", full_address: "", is_default: data.length === 0 });
    setShowForm(true);
  }
  function openEdit(a: any) {
    setEditing(a.id);
    form.reset({ label: a.label ?? "", recipient_name: a.recipient_name, phone: a.phone, province: a.province, city: a.city, district: a.district, village: a.village ?? "", postal_code: a.postal_code, full_address: a.full_address, is_default: a.is_default });
    setShowForm(true);
  }

  const m = useMutation({
    mutationFn: upFn,
    onSuccess: () => { toast.success("Alamat tersimpan"); qc.invalidateQueries({ queryKey: ["addresses"] }); setShowForm(false); },
  });
  const dm = useMutation({
    mutationFn: delFn,
    onSuccess: () => { toast.success("Alamat dihapus"); qc.invalidateQueries({ queryKey: ["addresses"] }); },
  });

  return (
    <AccountLayout title="Buku Alamat" description="Simpan alamat untuk checkout yang lebih cepat.">
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate} className="rounded-none"><Plus className="mr-2 h-4 w-4" />Tambah Alamat</Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada alamat tersimpan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((a: any) => (
            <div key={a.id} className="border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{a.label || "Alamat"}{a.is_default && " · Utama"}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{a.recipient_name}</p>
                  <p className="text-xs text-muted-foreground">{a.phone}</p>
                </div>
                <button onClick={() => dm.mutate({ data: { id: a.id } })} className="text-muted-foreground hover:text-destructive" aria-label="Hapus">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {a.full_address}, {a.district}, {a.city}, {a.province} {a.postal_code}
              </p>
              <button onClick={() => openEdit(a)} className="mt-3 text-xs text-primary hover:underline">Edit</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={form.handleSubmit((v) => m.mutate({ data: { id: editing ?? undefined, data: v } as any }))}
          className="mt-10 border border-border p-6"
        >
          <h3 className="font-display text-lg">{editing ? "Ubah Alamat" : "Alamat Baru"}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Label (mis. Rumah, Kantor)"><Input className="rounded-none" {...form.register("label")} /></Field>
            <Field label="Nama Penerima" error={form.formState.errors.recipient_name?.message}><Input className="rounded-none" {...form.register("recipient_name")} /></Field>
            <Field label="No. Telepon" error={form.formState.errors.phone?.message}><Input className="rounded-none" {...form.register("phone")} /></Field>
            <Field label="Provinsi" error={form.formState.errors.province?.message}><Input className="rounded-none" {...form.register("province")} /></Field>
            <Field label="Kota/Kabupaten" error={form.formState.errors.city?.message}><Input className="rounded-none" {...form.register("city")} /></Field>
            <Field label="Kecamatan" error={form.formState.errors.district?.message}><Input className="rounded-none" {...form.register("district")} /></Field>
            <Field label="Kelurahan"><Input className="rounded-none" {...form.register("village")} /></Field>
            <Field label="Kode Pos" error={form.formState.errors.postal_code?.message}><Input className="rounded-none" {...form.register("postal_code")} /></Field>
          </div>
          <Field label="Alamat Lengkap" className="mt-4" error={form.formState.errors.full_address?.message}>
            <Textarea rows={3} className="rounded-none" {...form.register("full_address")} />
          </Field>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <Checkbox checked={form.watch("is_default") ?? false} onCheckedChange={(v) => form.setValue("is_default", Boolean(v))} className="rounded-none" />
            <span className="text-muted-foreground">Jadikan alamat utama</span>
          </label>
          <div className="mt-6 flex gap-2">
            <Button type="submit" disabled={m.isPending} className="rounded-none">Simpan</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-none">Batal</Button>
          </div>
        </form>
      )}
    </AccountLayout>
  );
}

function Field({ label, children, error, className }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}