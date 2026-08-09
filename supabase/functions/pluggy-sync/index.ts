import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPluggyApiKey, pluggyFetch } from '../_shared/pluggy.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

function toDateOnly(v: string | null | undefined): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  return v.slice(0, 10);
}

export async function syncItem(admin: ReturnType<typeof createClient>, apiKey: string, connection: any) {
  const item = await pluggyFetch(apiKey, `/items/${connection.pluggy_item_id}`);

  await admin.from('bank_connections').update({
    status: item.status ?? 'UNKNOWN',
    status_detail: item.error?.message ?? null,
    institution_name: item.connector?.name ?? connection.institution_name,
    institution_logo: item.connector?.imageUrl ?? connection.institution_logo,
  }).eq('id', connection.id);

  const accountsRes = await pluggyFetch(apiKey, `/accounts?itemId=${connection.pluggy_item_id}`);
  const accounts = accountsRes?.results ?? [];

  let imported = 0;

  for (const acc of accounts) {
    const { data: accountRow } = await admin.from('bank_accounts').upsert({
      company_id: connection.company_id,
      connection_id: connection.id,
      pluggy_account_id: acc.id,
      name: acc.name ?? acc.marketingName ?? '',
      type: acc.type ?? null,
      subtype: acc.subtype ?? null,
      number: acc.number ?? null,
      balance: acc.balance ?? 0,
      currency: acc.currencyCode ?? 'BRL',
    }, { onConflict: 'connection_id,pluggy_account_id' }).select('id').single();

    if (!accountRow) continue;

    const from = connection.last_synced_at
      ? new Date(connection.last_synced_at).toISOString().slice(0, 10)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let page = 1;
    while (true) {
      const txRes = await pluggyFetch(apiKey, `/transactions?accountId=${acc.id}&from=${from}&pageSize=500&page=${page}`);
      const results = txRes?.results ?? [];
      if (results.length === 0) break;

      const rows = results.map((t: any) => ({
        company_id: connection.company_id,
        account_id: accountRow.id,
        pluggy_transaction_id: t.id,
        date: toDateOnly(t.date),
        description: t.description ?? t.descriptionRaw ?? '',
        amount: Math.abs(Number(t.amount ?? 0)),
        type: Number(t.amount ?? 0) >= 0 ? 'credit' : 'debit',
        category: t.category ?? null,
      }));

      const { error } = await admin.from('bank_transactions').upsert(rows, {
        onConflict: 'pluggy_transaction_id',
        ignoreDuplicates: true,
      });
      if (error) console.error('upsert transactions error:', error.message);
      imported += rows.length;

      if (results.length < 500 || page >= (txRes?.totalPages ?? page)) break;
      page++;
    }
  }

  await admin.from('bank_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connection.id);
  return imported;
}

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
