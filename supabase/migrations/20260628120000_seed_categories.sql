INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Gamis', 'gamis', 'Gamis elegan untuk berbagai acara', 1, true),
  ('Daster', 'daster', 'Daster nyaman untuk sehari-hari', 2, true),
  ('Setelan Muslim', 'setelan-muslim', 'Setelan muslim modern', 3, true),
  ('Mukena', 'mukena', 'Mukena nyaman untuk ibadah', 4, true),
  ('Aksesoris', 'aksesoris', 'Pelengkap penampilan Anda', 5, true)
ON CONFLICT (slug) DO NOTHING;
