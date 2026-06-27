export function formatIDR(n: number | string | null | undefined): string {
  const value = typeof n === "string" ? Number(n) : (n ?? 0);
  if (Number.isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateID(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateOnly(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  terverifikasi: "Pembayaran Terverifikasi",
  diproses: "Sedang Diproses",
  dikemas: "Dikemas",
  dikirim: "Dikirim",
  dalam_perjalanan: "Dalam Perjalanan",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  ditolak: "Pembayaran Ditolak",
};

export const ORDER_STATUS_FLOW = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "terverifikasi",
  "diproses",
  "dikemas",
  "dikirim",
  "dalam_perjalanan",
  "selesai",
] as const;