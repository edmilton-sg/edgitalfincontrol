import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPluggyApiKey } from '../_shared/pluggy.ts';
import { syncItem } from '../_shared/sync.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const connectionId: string | undefined = body.connectionId;
    const companyId: string | undefined = body.companyId;
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // RLS-scoped read: only connections the user can access are returned
    let query = userClient.from('bank_connections').select('*').eq('company_id', companyId);
    if (connectionId) query = query.eq('id', connectionId);
    const { data: connections, error: connErr } = await query;
    if (connErr) throw new Error(connErr.message);
    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ imported: 0, message: 'Nenhuma conexão encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const apiKey = await getPluggyApiKey();

    let imported = 0;
    for (const conn of connections) {
      imported += await syncItem(admin, apiKey, conn);
    }

    return new Response(JSON.stringify({ imported }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('pluggy-sync failed:', e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
