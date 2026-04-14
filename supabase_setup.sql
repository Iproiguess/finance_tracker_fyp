-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_token UUID DEFAULT gen_random_uuid()
);

-- Create categories table
CREATE TABLE public.categories (
  category_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  color_code TEXT DEFAULT '#007bff'
);

-- Create transactions table
CREATE TABLE public.transactions (
  transaction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(category_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create budgets table
CREATE TABLE public.budgets (
  budget_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(category_id) ON DELETE CASCADE,
  category_ids UUID[] DEFAULT '{}',
  monthly_limit DECIMAL(12,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  rollover BOOLEAN DEFAULT FALSE
);

-- Ensure older deployments can support multiple-category budgets
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}';

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS budget_name TEXT;

UPDATE public.budgets
SET category_ids = ARRAY[category_id]
WHERE (category_ids IS NULL OR category_ids = '{}')
  AND category_id IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can only see their own verified row" ON public.users
  FOR ALL USING (auth.uid() = id AND verified = true);

-- Policies for categories
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Policies for budgets
CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);

-- Trigger for auto-creating verified column when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update verified status when email is confirmed
CREATE OR REPLACE FUNCTION public.refresh_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
      SET verified = TRUE
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.refresh_verified();

-- Function to automatically create default "Unset" category for new users
CREATE OR REPLACE FUNCTION public.create_unset_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, category_name, type)
  VALUES (NEW.id, 'Unset', 'expense')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON public.users;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_unset_category();

-- Function to delete unverified users after 1 day
CREATE OR REPLACE FUNCTION public.delete_unverified_users()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.users u
  USING auth.users a
  WHERE u.id = a.id
    AND a.email_confirmed_at IS NULL
    AND a.created_at < NOW() - INTERVAL '1 day';

  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '1 day';
$$;