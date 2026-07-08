
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  underlying TEXT NOT NULL,
  spot NUMERIC NOT NULL,
  expiry DATE NOT NULL,
  legs JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategies TO authenticated;
GRANT SELECT ON public.strategies TO anon;
GRANT ALL ON public.strategies TO service_role;

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own strategies" ON public.strategies
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public strategies are readable" ON public.strategies
  FOR SELECT USING (is_public = true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER strategies_touch BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX strategies_user_idx ON public.strategies(user_id);
CREATE INDEX strategies_public_idx ON public.strategies(is_public) WHERE is_public = true;
