-- =====================================================================
-- Kitoko : base de données Supabase
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Profil de chaque utilisateur (cliente, coiffeuse, fournisseur)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- Équipe Kitoko (gère les salons importés qui n'ont pas encore de compte)
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- Salons et coiffeuses
create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid unique references auth.users on delete set null,   -- null = salon importé, géré par l'équipe
  name text not null check (char_length(name) between 2 and 60),
  mode text not null default 'salon' check (mode in ('salon','domicile','chez-elle')),
  city text not null,
  area text,
  address text,
  styles text[] not null default '{}',
  price_from int check (price_from >= 0),
  phone text,
  whatsapp boolean not null default false,
  instagram text,
  website text,
  languages text[] not null default '{}',
  bio text check (char_length(bio) <= 300),
  verified boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);

-- Rendez-vous
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null default auth.uid() references auth.users on delete cascade,
  salon_id uuid not null references public.salons on delete cascade,
  service text not null,
  date date not null,
  time text not null check (time ~ '^\d{2}:\d{2}$'),
  duration_min int not null default 120,
  first_name text not null,
  phone text,
  note text check (char_length(note) <= 300),
  status text not null default 'attente' check (status in ('attente','confirme','refuse','annule')),
  salon_message text check (char_length(salon_message) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_salon_idx on public.bookings (salon_id, date);
create index if not exists bookings_client_idx on public.bookings (client_id, date);

-- Avis (un par rendez-vous validé et passé)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings on delete cascade,
  salon_id uuid not null references public.salons on delete cascade,
  client_id uuid not null default auth.uid() references auth.users on delete cascade,
  stars int not null check (stars between 1 and 5),
  satisfied boolean not null,
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

-- Fournisseurs de mèches
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  city text not null,
  zones text[] not null default '{}',
  fee numeric(8,2) not null default 0 check (fee >= 0),
  delay text not null default '24 h',
  payments text[] not null default '{"Espèces à la livraison"}',
  iban text,
  phone text,
  whatsapp boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers on delete cascade,
  type text not null,
  name text,
  color text not null,
  length int,
  price numeric(8,2) not null check (price > 0),
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

-- Commandes de mèches
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null default auth.uid() references auth.users on delete cascade,
  supplier_id uuid not null references public.suppliers on delete cascade,
  lines jsonb not null,                       -- [{product_id, label, qty, price}]
  total numeric(10,2) not null,
  fee numeric(8,2) not null default 0,
  payment_method text not null,
  paid boolean not null default false,
  buyer_name text not null,
  deliver_kind text not null check (deliver_kind in ('salon','adresse')),
  deliver_salon_id uuid references public.salons on delete set null,
  deliver_address text,
  deliver_city text,
  booking_id uuid references public.bookings on delete set null,
  needed_by date not null,
  note text check (char_length(note) <= 300),
  status text not null default 'envoyee' check (status in ('envoyee','acceptee','en_route','livree','refusee','annulee')),
  supplier_message text check (char_length(supplier_message) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jetons de notifications push (un par téléphone)
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.owns_salon(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.salons where id = sid and owner_id = auth.uid());
$$;

create or replace function public.manages_salon(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.salons where id = sid
                 and (owner_id = auth.uid() or (owner_id is null and public.is_admin())));
$$;

create or replace function public.owns_supplier(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.suppliers where id = sid and owner_id = auth.uid());
$$;

-- Profil créé automatiquement à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Règles de modification (qui peut changer quoi)
-- ---------------------------------------------------------------------

-- Rendez-vous : la cliente peut seulement annuler ; le salon valide ou refuse.
create or replace function public.guard_booking_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.manages_salon(old.salon_id) then
    if new.client_id <> old.client_id or new.salon_id <> old.salon_id or new.service <> old.service
       or new.date <> old.date or new.time <> old.time or new.first_name <> old.first_name
       or coalesce(new.phone,'') <> coalesce(old.phone,'') or coalesce(new.note,'') <> coalesce(old.note,'') then
      raise exception 'Le salon peut seulement valider, refuser ou laisser un message.';
    end if;
    return new;
  elsif auth.uid() = old.client_id then
    if new.status <> 'annule' or old.status not in ('attente','confirme')
       or new.salon_message is distinct from old.salon_message then
      raise exception 'La cliente peut seulement annuler son rendez-vous.';
    end if;
    return new;
  end if;
  raise exception 'Modification non autorisée.';
end $$;
drop trigger if exists booking_guard on public.bookings;
create trigger booking_guard before update on public.bookings
  for each row execute function public.guard_booking_update();

-- Commandes : l'acheteur peut annuler tant que rien n'est accepté ;
-- le fournisseur fait avancer la livraison et marque le paiement.
create or replace function public.guard_order_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.owns_supplier(old.supplier_id) then
    if new.lines <> old.lines or new.total <> old.total or new.fee <> old.fee
       or new.buyer_id <> old.buyer_id or new.payment_method <> old.payment_method
       or new.deliver_kind <> old.deliver_kind
       or new.deliver_salon_id is distinct from old.deliver_salon_id
       or new.deliver_address is distinct from old.deliver_address then
      raise exception 'Le fournisseur peut seulement changer le statut, le paiement et le message.';
    end if;
    return new;
  elsif auth.uid() = old.buyer_id then
    if new.status <> 'annulee' or old.status <> 'envoyee' or new.paid <> old.paid then
      raise exception 'Tu peux seulement annuler une commande pas encore acceptée.';
    end if;
    return new;
  end if;
  raise exception 'Modification non autorisée.';
end $$;
drop trigger if exists order_guard on public.orders;
create trigger order_guard before update on public.orders
  for each row execute function public.guard_order_update();

-- Vue publique des notes par salon
create or replace view public.salon_ratings with (security_invoker = true) as
  select salon_id, round(avg(stars)::numeric, 1) as avg_stars, count(*) as n_reviews,
         round(100.0 * avg(case when satisfied then 1 else 0 end))::int as pct_satisfied
  from public.reviews group by salon_id;

-- ---------------------------------------------------------------------
-- Sécurité par ligne (RLS)
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.admins      enable row level security;
alter table public.salons      enable row level security;
alter table public.bookings    enable row level security;
alter table public.reviews     enable row level security;
alter table public.suppliers   enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.push_tokens enable row level security;

-- Profils : chacun voit et modifie le sien
drop policy if exists "profil lu" on public.profiles;
create policy "profil lu" on public.profiles for select using (id = auth.uid());
drop policy if exists "profil modifié" on public.profiles;
create policy "profil modifié" on public.profiles for update using (id = auth.uid());

drop policy if exists "admins lus" on public.admins;
create policy "admins lus" on public.admins for select using (user_id = auth.uid());

-- Salons : visibles par tous ; chaque coiffeuse gère le sien ; l'équipe gère tout
drop policy if exists "salons visibles" on public.salons;
create policy "salons visibles" on public.salons for select using (true);
drop policy if exists "salon créé" on public.salons;
create policy "salon créé" on public.salons for insert with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists "salon modifié" on public.salons;
create policy "salon modifié" on public.salons for update using (owner_id = auth.uid() or public.is_admin());
drop policy if exists "salon supprimé" on public.salons;
create policy "salon supprimé" on public.salons for delete using (owner_id = auth.uid() or public.is_admin());

-- Rendez-vous : la cliente et le salon concerné seulement
drop policy if exists "rdv lus" on public.bookings;
create policy "rdv lus" on public.bookings for select
  using (client_id = auth.uid() or public.manages_salon(salon_id));
drop policy if exists "rdv créé" on public.bookings;
create policy "rdv créé" on public.bookings for insert
  with check (client_id = auth.uid() and date >= current_date and status = 'attente');
drop policy if exists "rdv modifié" on public.bookings;
create policy "rdv modifié" on public.bookings for update
  using (client_id = auth.uid() or public.manages_salon(salon_id));

-- Avis : lisibles par tous ; seulement après un rendez-vous validé et passé
drop policy if exists "avis lus" on public.reviews;
create policy "avis lus" on public.reviews for select using (true);
drop policy if exists "avis créé" on public.reviews;
create policy "avis créé" on public.reviews for insert with check (
  client_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid()
      and b.salon_id = reviews.salon_id and b.status = 'confirme' and b.date <= current_date));
drop policy if exists "avis modifié" on public.reviews;
create policy "avis modifié" on public.reviews for update using (client_id = auth.uid());
drop policy if exists "avis supprimé" on public.reviews;
create policy "avis supprimé" on public.reviews for delete using (client_id = auth.uid() or public.is_admin());

-- Fournisseurs et produits : visibles par tous ; chaque fournisseur gère sa boutique
drop policy if exists "fournisseurs visibles" on public.suppliers;
create policy "fournisseurs visibles" on public.suppliers for select using (true);
drop policy if exists "boutique créée" on public.suppliers;
create policy "boutique créée" on public.suppliers for insert with check (owner_id = auth.uid());
drop policy if exists "boutique modifiée" on public.suppliers;
create policy "boutique modifiée" on public.suppliers for update using (owner_id = auth.uid() or public.is_admin());
drop policy if exists "boutique supprimée" on public.suppliers;
create policy "boutique supprimée" on public.suppliers for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "produits visibles" on public.products;
create policy "produits visibles" on public.products for select using (true);
drop policy if exists "produits gérés" on public.products;
create policy "produits gérés" on public.products for all
  using (public.owns_supplier(supplier_id)) with check (public.owns_supplier(supplier_id));

-- Commandes : l'acheteur, le fournisseur et le salon de livraison
drop policy if exists "commandes lues" on public.orders;
create policy "commandes lues" on public.orders for select using (
  buyer_id = auth.uid() or public.owns_supplier(supplier_id)
  or (deliver_salon_id is not null and public.owns_salon(deliver_salon_id)));
drop policy if exists "commande créée" on public.orders;
create policy "commande créée" on public.orders for insert
  with check (buyer_id = auth.uid() and status = 'envoyee' and paid = false);
drop policy if exists "commande modifiée" on public.orders;
create policy "commande modifiée" on public.orders for update
  using (buyer_id = auth.uid() or public.owns_supplier(supplier_id));

-- Jetons push : chacun gère les siens
drop policy if exists "jetons gérés" on public.push_tokens;
create policy "jetons gérés" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mises à jour en direct (écrans qui se rafraîchissent tout seuls)
do $$ begin
  alter publication supabase_realtime add table public.bookings, public.orders;
exception when others then null; end $$;

-- Suppression de compte depuis l'app (exigée par Apple et par le RGPD)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  update public.salons set owner_id = null where owner_id = auth.uid();   -- la fiche publique reste, sans compte
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
