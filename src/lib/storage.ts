import { supabase } from "@/integrations/supabase/client";

export function publicMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("product-media").getPublicUrl(path);
  return data.publicUrl;
}

export function publicAvatarUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function fileToWebP(file: File, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D tidak tersedia"));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Konversi WebP gagal"));
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Gagal membaca file gambar"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) throw new Error("Ukuran file maksimal 5MB");
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar");

  const blob = await fileToWebP(file);
  const path = `products/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("product-media").upload(path, blob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-media").getPublicUrl(path);
  return data.publicUrl;
}
