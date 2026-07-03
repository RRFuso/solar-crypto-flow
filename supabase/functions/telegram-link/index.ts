import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(chatId: number | string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('[telegram-link] sendMessage error', e);
  }
}

async function handleGenerate(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub as string;

  // Delete stale codes for this user
  await admin.from('telegram_link_codes').delete().eq('user_id', userId);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await admin.from('telegram_link_codes').insert({
    user_id: userId, code, expires_at: expiresAt,
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ code, expires_at: expiresAt }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleUnlink(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub as string;

  await admin.from('user_alert_preferences').update({
    telegram_chat_id: null, telegram_linked_at: null,
  }).eq('user_id', userId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleTelegramWebhook(update: Record<string, unknown>): Promise<Response> {
  const message = (update.message ?? update.edited_message) as
    | { chat?: { id: number }; from?: { id: number; first_name?: string }; text?: string }
    | undefined;

  if (!message?.chat?.id || !message.text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Accept "/start CODE" (deep-link) or bare "CODE"
  let code: string | null = null;
  const startMatch = text.match(/^\/start\s+(\d{6})$/);
  if (startMatch) code = startMatch[1];
  else if (/^\d{6}$/.test(text)) code = text;

  if (!code) {
    await sendTelegramMessage(
      chatId,
      '👋 Envie o código de 6 dígitos gerado no app para vincular seu Telegram aos alertas do SolCry.',
    );
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: linkRow, error: fetchErr } = await admin
    .from('telegram_link_codes')
    .select('id, user_id, expires_at, consumed_at')
    .eq('code', code)
    .maybeSingle();

  if (fetchErr || !linkRow) {
    await sendTelegramMessage(chatId, '❌ Código inválido. Gere um novo código no app.');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (linkRow.consumed_at) {
    await sendTelegramMessage(chatId, '⚠️ Este código já foi utilizado.');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (new Date(linkRow.expires_at).getTime() < Date.now()) {
    await sendTelegramMessage(chatId, '⏳ Código expirado. Gere um novo no app.');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Upsert preferences with telegram_chat_id
  const { data: existing } = await admin
    .from('user_alert_preferences')
    .select('id')
    .eq('user_id', linkRow.user_id)
    .maybeSingle();

  if (existing) {
    await admin.from('user_alert_preferences').update({
      telegram_chat_id: String(chatId),
      telegram_linked_at: new Date().toISOString(),
    }).eq('user_id', linkRow.user_id);
  } else {
    await admin.from('user_alert_preferences').insert({
      user_id: linkRow.user_id,
      telegram_chat_id: String(chatId),
      telegram_linked_at: new Date().toISOString(),
    });
  }

  await admin.from('telegram_link_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', linkRow.id);

  await sendTelegramMessage(
    chatId,
    '✅ <b>Telegram vinculado!</b>\n\nVocê receberá aqui os alertas de smart money do SolCry.',
  );

  return new Response(JSON.stringify({ ok: true, linked: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Telegram webhook update
    if (typeof body?.update_id === 'number') {
      return await handleTelegramWebhook(body);
    }

    const action = body?.action as string | undefined;
    if (action === 'generate') return await handleGenerate(req);
    if (action === 'unlink') return await handleUnlink(req);

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[telegram-link] error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
