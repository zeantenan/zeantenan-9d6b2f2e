import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile, deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

const qo = queryOptions({ queryKey: ["profile"], queryFn: () => getProfile() });
const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20),
});

export const Route = createFileRoute("/_authenticated/akun/profil")({
  head: () => ({
    meta: [
      { title: "Profil — ZEAN TENAN" },
      { name: "description", content: "Kelola informasi pribadi akun ZEAN TENAN Anda." },
    ],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  const { data: profile } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const updFn = useServerFn(updateProfile);
  const delFn = useServerFn(deleteAccount);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" },
  });

  const m = useMutation({
    mutationFn: updFn,
    onSuccess: () => {
      toast.success("Profil diperbarui");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const dm = useMutation({
    mutationFn: delFn,
    onSuccess: async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    },
  });

  return (
    <AccountLayout title="Profil" description="Kelola informasi pribadi Anda.">
      <form
        onSubmit={form.handleSubmit((v) => m.mutate({ data: v }))}
        className="max-w-lg space-y-4"
      >
        <div>
          <Label>Nama Lengkap</Label>
          <Input className="rounded-none" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.full_name.message}
            </p>
          )}
        </div>
        <div>
          <Label>No. Telepon</Label>
          <Input className="rounded-none" {...form.register("phone")} />
        </div>
        <Button type="submit" disabled={m.isPending} className="rounded-none">
          Simpan Perubahan
        </Button>
      </form>

      <div className="mt-16 border-t border-border pt-8">
        <h3 className="font-display text-lg text-destructive">Hapus Akun</h3>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Tindakan ini akan menghapus akun Anda secara permanen beserta seluruh data terkait. Tidak
          dapat dibatalkan.
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-none border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          disabled={dm.isPending}
          onClick={() => {
            if (confirm("Yakin ingin menghapus akun? Tindakan ini tidak bisa dibatalkan."))
              dm.mutate({} as any);
          }}
        >
          Hapus Akun Permanen
        </Button>
      </div>
    </AccountLayout>
  );
}
