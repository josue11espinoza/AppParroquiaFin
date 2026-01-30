-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'priest');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Add user_id column to priests table to link priest accounts
ALTER TABLE public.priests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to get priest_id for a user
CREATE OR REPLACE FUNCTION public.get_priest_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.priests WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Update priest_schedules policies for role-based access
DROP POLICY IF EXISTS "Allow public read schedules" ON public.priest_schedules;
DROP POLICY IF EXISTS "Allow public insert schedules" ON public.priest_schedules;
DROP POLICY IF EXISTS "Allow public update schedules" ON public.priest_schedules;
DROP POLICY IF EXISTS "Allow public delete schedules" ON public.priest_schedules;

CREATE POLICY "Authenticated users can read schedules" ON public.priest_schedules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert schedules" ON public.priest_schedules
    FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins or own priest can update schedules" ON public.priest_schedules
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR 
        priest_id = public.get_priest_id_for_user(auth.uid())
    );

CREATE POLICY "Admins can delete schedules" ON public.priest_schedules
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update other tables to require authentication
DROP POLICY IF EXISTS "Allow public read parishioners" ON public.parishioners;
DROP POLICY IF EXISTS "Allow public insert parishioners" ON public.parishioners;
DROP POLICY IF EXISTS "Allow public update parishioners" ON public.parishioners;
DROP POLICY IF EXISTS "Allow public delete parishioners" ON public.parishioners;

CREATE POLICY "Authenticated users can read parishioners" ON public.parishioners
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert parishioners" ON public.parishioners
    FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parishioners" ON public.parishioners
    FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete parishioners" ON public.parishioners
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow public read priests" ON public.priests;
DROP POLICY IF EXISTS "Allow public insert priests" ON public.priests;
DROP POLICY IF EXISTS "Allow public update priests" ON public.priests;
DROP POLICY IF EXISTS "Allow public delete priests" ON public.priests;

CREATE POLICY "Authenticated users can read priests" ON public.priests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert priests" ON public.priests
    FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update priests" ON public.priests
    FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete priests" ON public.priests
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow public read sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Allow public insert sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Allow public update sacraments" ON public.sacraments;
DROP POLICY IF EXISTS "Allow public delete sacraments" ON public.sacraments;

CREATE POLICY "Authenticated users can read sacraments" ON public.sacraments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert sacraments" ON public.sacraments
    FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sacraments" ON public.sacraments
    FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sacraments" ON public.sacraments
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();