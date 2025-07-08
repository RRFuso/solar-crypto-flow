from supabase import create_client, Client

SUPABASE_URL = 'https://bahshstcztvqmxiubslx.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0OTc5MCwiZXhwIjoyMDYzOTI1NzkwfQ.IqjJdvQbywC78qJV0oz4T9H8iMZ6BeiF6lF1svoszYo'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_token_contracts_table():
    try:
        # Check if the table already exists to avoid errors
        # This part of the Supabase client is for data, not schema. 
        # Direct table creation is not supported via the client.
        # The best way to create tables in Supabase is via the dashboard or migrations.
        print("Please create the 'token_contracts' table manually in your Supabase dashboard with the following schema:")
        print("CREATE TABLE public.token_contracts (")
        print("    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),")
        print("    symbol TEXT NOT NULL UNIQUE,")
        print("    contract_address TEXT NOT NULL,")
        print("    chain TEXT NOT NULL DEFAULT 'ethereum'")
        print(");")
        print("ALTER TABLE public.token_contracts ENABLE ROW LEVEL SECURITY;")
        print("CREATE POLICY \"Enable read access for all users\" ON public.token_contracts FOR SELECT USING (TRUE);")
        print("CREATE POLICY \"Enable insert for authenticated users only\" ON public.token_contracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');")
        print("CREATE POLICY \"Enable update for authenticated users only\" ON public.token_contracts FOR UPDATE USING (auth.role() = 'authenticated');")
        print("CREATE POLICY \"Enable delete for authenticated users only\" ON public.token_contracts FOR DELETE USING (auth.role() = 'authenticated');")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    create_token_contracts_table()


