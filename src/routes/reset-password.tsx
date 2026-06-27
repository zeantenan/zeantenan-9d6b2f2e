import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Atur Ulang Password — ZEAN TENAN" },
      { name: "description", content: "Buat password baru untuk akun ZEAN TENAN Anda." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Minimal 8 karakter").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Konfirmasi tidak cocok" });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token from URL hash via detectSessionInUrl
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) return toast.error("Gagal memperbarui password", { description: error.message });
    toast.success("Password berhasil diperbarui.");
    navigate({ to: "/akun" });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Keamanan</p>
        <h1 className="mt-3 font-display text-3xl text-foreground">Atur ulang password</h1>
        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Tautan reset sedang diverifikasi… Bila Anda tidak masuk dari email reset, silakan klik kembali tautan dari email Anda.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="np">Password baru</Label>
              <Input id="np" type="password" className="rounded-none" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cp">Konfirmasi password baru</Label>
              <Input id="cp" type="password" className="rounded-none" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-none">Simpan Password</Button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}