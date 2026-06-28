import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — ZEAN TENAN" },
      {
        name: "description",
        content:
          "Masuk ke akun ZEAN TENAN Anda atau daftar untuk mulai berbelanja gamis dan daster original dari Kota Batik Indonesia.",
      },
      { property: "og:title", content: "Masuk atau Daftar — ZEAN TENAN" },
      {
        property: "og:description",
        content:
          "Masuk ke akun Anda untuk pengalaman belanja gamis & daster original yang lebih personal.",
      },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(72),
});
const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().email("Format email tidak valid").max(255),
  password: z.string().min(8, "Minimal 8 karakter").max(72),
});
const resetSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(255),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/akun" });
    });
  }, [navigate]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "" },
  });
  const resetForm = useForm({ resolver: zodResolver(resetSchema), defaultValues: { email: "" } });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) return toast.error("Gagal masuk", { description: error.message });
    toast.success("Selamat datang kembali!");
    navigate({ to: "/akun" });
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.full_name },
      },
    });
    setLoading(false);
    if (error) return toast.error("Gagal mendaftar", { description: error.message });
    toast.success("Akun berhasil dibuat", { description: "Silakan masuk dengan akun baru Anda." });
    setMode("login");
    loginForm.setValue("email", values.email);
  }

  async function onReset(values: z.infer<typeof resetSchema>) {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error("Gagal mengirim email", { description: error.message });
    toast.success("Email reset password telah dikirim", {
      description: "Periksa kotak masuk Anda.",
    });
    setMode("login");
  }

  async function onGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setLoading(false);
        toast.error("Gagal masuk dengan Google", { description: error.message });
      }
    } catch (err) {
      setLoading(false);
      toast.error("Gagal masuk dengan Google", { description: String(err) });
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden border-r border-border pr-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Akun Anda</p>
            <h1 className="mt-6 font-display text-5xl leading-tight text-foreground">
              Masuk untuk pengalaman
              <br />
              belanja yang lebih personal.
            </h1>
            <p className="mt-6 max-w-md text-sm text-muted-foreground">
              Pantau pesanan, simpan alamat, dan kelola wishlist Anda dari satu dasbor sederhana.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            ZEAN TENAN · Pekalongan
          </div>
        </div>

        <div className="flex items-start">
          <div className="w-full max-w-md">
            <Tabs
              value={mode === "forgot" ? "login" : mode}
              onValueChange={(v) => setMode(v as "login" | "register" | "forgot")}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="login" className="rounded-none">
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-none">
                  Daftar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-8 space-y-6">
                {mode === "forgot" ? (
                  <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        className="rounded-none"
                        {...resetForm.register("email")}
                      />
                      {resetForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-destructive">
                          {resetForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <Button disabled={loading} type="submit" className="w-full rounded-none">
                      Kirim tautan reset
                    </Button>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      Kembali ke halaman masuk
                    </button>
                  </form>
                ) : (
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        className="rounded-none"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        className="rounded-none"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <Link to="/" className="text-muted-foreground hover:text-foreground">
                        Kembali ke beranda
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-primary hover:underline"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <Button disabled={loading} type="submit" className="w-full rounded-none">
                      Masuk
                    </Button>
                  </form>
                )}
                <OrDivider />
                <Button
                  onClick={onGoogle}
                  variant="outline"
                  disabled={loading}
                  className="w-full rounded-none"
                >
                  Masuk dengan Google
                </Button>
              </TabsContent>

              <TabsContent value="register" className="mt-8 space-y-6">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Label htmlFor="r-name">Nama Lengkap</Label>
                    <Input
                      id="r-name"
                      className="rounded-none"
                      {...registerForm.register("full_name")}
                    />
                    {registerForm.formState.errors.full_name && (
                      <p className="mt-1 text-xs text-destructive">
                        {registerForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="r-email">Email</Label>
                    <Input
                      id="r-email"
                      type="email"
                      className="rounded-none"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="r-pass">Password</Label>
                    <Input
                      id="r-pass"
                      type="password"
                      className="rounded-none"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Minimal 8 karakter, hindari password yang pernah bocor.
                    </p>
                  </div>
                  <Button disabled={loading} type="submit" className="w-full rounded-none">
                    Buat Akun
                  </Button>
                </form>
                <OrDivider />
                <Button
                  onClick={onGoogle}
                  variant="outline"
                  disabled={loading}
                  className="w-full rounded-none"
                >
                  Daftar dengan Google
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Dengan mendaftar Anda menyetujui Syarat &amp; Ketentuan ZEAN TENAN.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
    </div>
  );
}
