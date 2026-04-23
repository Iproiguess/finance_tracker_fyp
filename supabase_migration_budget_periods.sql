-- Migration: Add flexible budget periods support
-- Adds custom date range capability alongside existing monthly budgets

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'monthly' CHECK (budget_type IN ('monthly', 'custom'));

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON public.budgets(start_date, end_date);

-- For existing monthly budgets, derive start_date and end_date from month/year
UPDATE public.budgets
SET 
  budget_type = 'monthly',
  start_date = DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD'))::DATE,
  end_date = (DATE_TRUNC('month', TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD')) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
WHERE budget_type = 'monthly' AND start_date IS NULL;
