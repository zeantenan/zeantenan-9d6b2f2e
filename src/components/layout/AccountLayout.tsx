import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, User, MapPin, Package, Heart, KeyRound, LogOut } from "lucide-react";
import { type ReactNode } from "react";
import { PublicLayout } from "./PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS = [
  { to: "/akun", label: "Dasbor", icon: LayoutDashboard, exact: true },
  { to: "/pesanan", label: "Riwayat Pesanan", icon: Package },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/akun/profil", label: "Profil", icon: User },
  { to: "/akun/alamat", label: "Alamat", icon: MapPin },
  { to: "/akun/password", label: "Ubah Password", icon: KeyRound },
];

export function AccountLayout({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Akun Saya</p>
          <h1 className="mt-2 font-display text-3xl text-foreground">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="space-y-0.5">
              {ITEMS.map((i) => {
                const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-primary bg-secondary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <i.icon className="h-4 w-4" />
                    {i.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </nav>
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </PublicLayout>
  );
}