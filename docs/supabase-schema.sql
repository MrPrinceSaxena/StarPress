-- ============================================================================
-- Star Press — Supabase Production Database & Row Level Security (RLS) Schema
-- ============================================================================

-- 1. Profiles Table (Automatically mirrored from auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- Anyone authenticated can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (name, avatar)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- ----------------------------------------------------------------------------
-- 2. Orders Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_email TEXT,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can only view their own orders
CREATE POLICY "Customers can view own orders"
    ON public.orders
    FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    );

-- Customers can insert their own orders
CREATE POLICY "Customers can create own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ONLY admins can update orders (change status, tracking, payment status)
CREATE POLICY "Admins can update orders"
    ON public.orders
    FOR UPDATE
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- ----------------------------------------------------------------------------
-- 3. Saved Addresses Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Office',
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users have full control over their own saved addresses
CREATE POLICY "Users can manage own addresses"
    ON public.addresses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Automatic Profile Creation Trigger on Auth Signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. Privileged Helper to Grant Admin Role (Service Role Only)
-- ----------------------------------------------------------------------------
-- Run this in Supabase SQL Editor to make a user an Admin:
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"ADMIN"')
-- WHERE email = 'admin@starpress.in';
