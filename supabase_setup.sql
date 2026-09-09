-- Finance Tracker Supabase setup. Safe to rerun after the initial schema exists.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_token UUID DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.categories (
  category_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  color_code TEXT DEFAULT '#007bff'
);

CREATE TABLE IF NOT EXISTS public.transactions (
  transaction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(category_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.budgets (
  budget_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category_ids UUID[] DEFAULT '{}',
  monthly_limit DECIMAL(12,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  rollover BOOLEAN DEFAULT FALSE,
  rollover_mode TEXT DEFAULT 'previous-month' CHECK (rollover_mode IN ('previous-month', 'full'))
);

CREATE TABLE IF NOT EXISTS public.automations (
  automation_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  frequency_days INTEGER,
  start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_executed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_name TEXT,
  ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS automation_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_automation_id_fkey'
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_automation_id_fkey
      FOREIGN KEY (automation_id)
      REFERENCES public.automations(automation_id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'budgets'
      AND column_name = 'category_id'
  ) THEN
    EXECUTE 'UPDATE public.budgets
      SET category_ids = ARRAY[category_id]
      WHERE (category_ids IS NULL OR category_ids = ''{}'')
        AND category_id IS NOT NULL';
  END IF;
END;
$$;

UPDATE public.budgets
SET
  budget_type = 'monthly',
  start_date = DATE_TRUNC('month', TO_DATE(year::text || '-' || LPAD(month::text, 2, '0') || '-01', 'YYYY-MM-DD'))::DATE,
  end_date = (DATE_TRUNC('month', TO_DATE(year::text || '-' || LPAD(month::text, 2, '0') || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
WHERE (budget_type = 'monthly' OR budget_type IS NULL)
  AND start_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_automation_id ON public.transactions(automation_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_ids ON public.budgets USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON public.budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_category_id ON public.automations(category_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own verified row" ON public.users;
DROP POLICY IF EXISTS "Users can select their own row" ON public.users;
CREATE POLICY "Users can select their own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own verified row" ON public.users;
DROP POLICY IF EXISTS "Users can update their own row" ON public.users;
CREATE POLICY "Users can update their own row" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can select their own categories" ON public.categories;
CREATE POLICY "Users can select their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select their own transactions" ON public.transactions;
CREATE POLICY "Users can select their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select their own budgets" ON public.budgets;
CREATE POLICY "Users can select their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select their own automations" ON public.automations;
CREATE POLICY "Users can select their own automations" ON public.automations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own automations" ON public.automations;
CREATE POLICY "Users can insert their own automations" ON public.automations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own automations" ON public.automations;
CREATE POLICY "Users can update their own automations" ON public.automations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own automations" ON public.automations;
CREATE POLICY "Users can delete their own automations" ON public.automations FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_automation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_automation_timestamp ON public.automations;
CREATE TRIGGER trigger_update_automation_timestamp
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_automation_timestamp();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.refresh_verified()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users SET verified = TRUE WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.refresh_verified();

CREATE OR REPLACE FUNCTION public.create_unset_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE user_id = NEW.id AND lower(category_name) = 'unset'
  ) THEN
    INSERT INTO public.categories (user_id, category_name, type)
    VALUES (NEW.id, 'Unset', 'expense');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_unset_category();

CREATE OR REPLACE FUNCTION public.delete_unverified_users()
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public, auth
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