import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/produk", label: "Katalog" },
  { to: "/kategori/gamis", label: "Gamis" },
  { to: "/kategori/daster", label: "Daster" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Cari produk">
              <Link to="/cari">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Keranjang">
              <Link to="/keranjang">
                <ShoppingBag className="h-5 w-5" />
              </Link>
            </Button>
            {hasSession ? (
              <Button asChild variant="ghost" size="icon" aria-label="Akun">
                <Link to="/akun">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="ml-2 hidden sm:inline-flex">
                <Link to="/auth">Masuk</Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Buka menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="py-2 text-sm text-foreground">
                  {n.label}
                </Link>
              ))}
              {!hasSession && (
                <Link to="/auth" className="py-2 text-sm font-medium text-primary">
                  Masuk / Daftar
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Original Gamis &amp; Daster dari Kota Batik Indonesia. Setiap helai dikerjakan dengan
              ketelitian pengrajin Pekalongan, dikirim langsung dari sentra batik ke rumah Anda.
            </p>
          </div>
          <FooterCol
            title="Belanja"
            items={[
              { to: "/produk", label: "Semua Produk" },
              { to: "/kategori/gamis", label: "Gamis" },
              { to: "/kategori/daster", label: "Daster" },
            ]}
          />
          <FooterCol
            title="Akun"
            items={[
              { to: "/auth", label: "Masuk / Daftar" },
              { to: "/akun", label: "Dasbor Akun" },
              { to: "/pesanan", label: "Riwayat Pesanan" },
              { to: "/wishlist", label: "Wishlist" },
            ]}
          />
          <FooterCol
            title="Bantuan"
            items={[
              { to: "/produk", label: "Panduan Ukuran" },
              { to: "/produk", label: "Cara Pemesanan" },
              { to: "/produk", label: "Kebijakan Pengembalian" },
            ]}
          />
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} ZEAN TENAN. Dibuat di Pekalongan.</span>
            <span>Original Gamis &amp; Daster · Kota Batik Indonesia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-display text-base text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.to + i.label}>
            <Link to={i.to} className="transition-colors hover:text-foreground">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
