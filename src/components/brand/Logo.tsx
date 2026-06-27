import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex flex-col leading-none ${className}`}>
      <span className="font-display text-xl tracking-tight text-foreground">ZEAN TENAN</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Kota Batik Indonesia
      </span>
    </Link>
  );
}