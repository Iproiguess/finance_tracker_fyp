-- Create automations table for recurring transaction management
CREATE TABLE public.automations (
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

-- Add automation_id to transactions table (to track which automation created it)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS automation_id UUID REFERENCES public.automations(automation_id) ON DELETE SET NULL;

-- Enable RLS for automations table
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own automations
CREATE POLICY "Users can select their own automations" ON public.automations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can INSERT their own automations
CREATE POLICY "Users can insert their own automations" ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own automations
CREATE POLICY "Users can update their own automations" ON public.automations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own automations
CREATE POLICY "Users can delete their own automations" ON public.automations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_automations_user_id ON public.automations(user_id);
CREATE INDEX idx_automations_category_id ON public.automations(category_id);
CREATE INDEX idx_automations_is_active ON public.automations(is_active);
CREATE INDEX idx_transactions_automation_id ON public.transactions(automation_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_automation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_automation_timestamp
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_automation_timestamp();
