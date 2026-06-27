import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  password: z.string().min(8, "Minimal 8 karakter").max(72),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Konfirmasi tidak cocok" });

export const Route = createFileRoute("/_authenticated/akun/password")({
  head: () => ({ meta: [{ title: "Ubah Password — ZEAN TENAN" }] }),
  component: PassPage,
});

function PassPage() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  async function onSubmit(v: z.infer<typeof schema>) {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) return toast.error("Gagal", { description: error.message });
    toast.success("Password diperbarui");
    form.reset({ password: "", confirm: "" });
  }
  return (
    <AccountLayout title="Ubah Password" description="Perbarui password akun Anda secara berkala.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <div>
          <Label>Password Baru</Label>
          <Input type="password" className="rounded-none" {...form.register("password")} />
          {form.formState.errors.password && <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <div>
          <Label>Konfirmasi Password</Label>
          <Input type="password" className="rounded-none" {...form.register("confirm")} />
          {form.formState.errors.confirm && <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="rounded-none">Simpan Password</Button>
      </form>
    </AccountLayout>
  );
}