
import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL || 'https://bahshstcztvqmxiubslx.supabase.co';
const anonKey = process.env.SUPABASE_ANON_KEY;
const functionUrl = `${supabaseUrl}/functions/v1/temp-migration-func`;

async function invoke() {
  if (!anonKey) {
    console.error('SUPABASE_ANON_KEY environment variable is not set.');
    process.exit(1);
  }

  try {
    console.log(`Invoking function at: ${functionUrl}`);
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}), // Empty body for this function
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Function invocation failed with status ${response.status}: ${JSON.stringify(result)}`);
    }

    console.log('Function invoked successfully:');
    console.log(result);

    // Check for specific success messages from the function
    if (result.message && result.message.includes('already exists')) {
        console.log("Confirmation: The 'ai_watchlist' table already exists.");
    } else {
        console.log("Confirmation: The 'ai_watchlist' table was likely created.");
    }


  } catch (error) {
    console.error('Error invoking function:', error);
    process.exit(1);
  }
}

invoke();
