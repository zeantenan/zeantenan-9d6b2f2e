
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-media', 'product-media', true, 5242880, NULL),
  ('avatars', 'avatars', true, 5242880, NULL),
  ('payment-proofs', 'payment-proofs', false, 5242880, NULL)
ON CONFLICT (id) DO NOTHING;
