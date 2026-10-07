// Shared authorization helpers for privileged edge-function actions.
// Never trust user_id / role / admin flags sent in the request body.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Caller =
  | { kind: 'service' }
  | { kind: 'cron' }
  | { kind: 'user'; userId: string; isAdmin: boolean }
  | { kind: 'anon' };

function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

/** Resolve who is calling. Service role key, DB cron secret (vault), or validated user JWT. */
export async function resolveCaller(req: Request): Promise<Caller> {
  const token = bearer(req);
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (token && serviceKey && timingSafeEqual(token, serviceKey)) return { kind: 'service' };

  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret && cronSecret.length >= 32 && cronSecret.length <= 256) {
    const { data, error } = await serviceClient().rpc('verify_cron_secret', { _secret: cronSecret });
    if (!error && data === true) return { kind: 'cron' };
  }

  if (token) {
    const admin = serviceClient();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data?.user) {
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
      return { kind: 'user', userId: data.user.id, isAdmin: isAdmin === true };
    }
  }
  return { kind: 'anon' };
}

export const isInternal = (c: Caller) => c.kind === 'service' || c.kind === 'cron';
export const isInternalOrAdmin = (c: Caller) => isInternal(c) || (c.kind === 'user' && c.isAdmin);

export function deny(caller: Caller, cors: Record<string, string>): Response {
  const status = caller.kind === 'anon' ? 401 : 403;
  return new Response(JSON.stringify({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
