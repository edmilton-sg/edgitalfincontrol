import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPluggyApiKey } from '../_shared/pluggy.ts';
import { syncItem } from '../pluggy-sync/index.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const itemId = payload?.itemId;
    const event = payload?.event ?? '';
    console.log('pluggy-webhook event:', event, 'item:', itemId);

    if (!itemId) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: connections } = await admin.from('bank_connections').select('*').eq('pluggy_item_id', itemId);
    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (event === 'item/deleted') {
      await admin.from('bank_connections').update({ status: 'DELETED' }).eq('pluggy_item_id', itemId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = await getPluggyApiKey();
    for (const conn of connections) {
      await syncItem(admin, apiKey, conn);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('pluggy-webhook failed:', e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
