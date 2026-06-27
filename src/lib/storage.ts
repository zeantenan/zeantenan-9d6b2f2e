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
