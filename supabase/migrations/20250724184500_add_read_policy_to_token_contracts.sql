-- Enable Row Level Security for the token_contracts table
ALTER TABLE public.token_contracts ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists, to avoid errors on re-running
DROP POLICY IF EXISTS "Allow public read access to token_contracts" ON public.token_contracts;

-- Create a new policy to grant read access to the 'token_contracts' table for all users
CREATE POLICY "Allow public read access to token_contracts"
ON public.token_contracts
FOR SELECT
USING (true);
