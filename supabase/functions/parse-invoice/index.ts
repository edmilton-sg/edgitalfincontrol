import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'content' field (extracted PDF text)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em extrair transações de faturas de cartão de crédito brasileiras.
Analise o texto extraído de um PDF de fatura e extraia TODAS as transações individuais.

Regras:
- Identifique data, descrição, valor e informações de parcela de cada transação.
- Datas podem estar nos formatos DD/MM, DD/MM/YY ou DD/MM/YYYY. Sempre retorne no formato YYYY-MM-DD. Se o ano não estiver explícito, assuma o ano corrente da fatura (geralmente mencionado no cabeçalho).
- Valores estão em reais (R$). Retorne como número (ex: 149.90, não "149,90").
- Ignore linhas de resumo, totais, pagamentos anteriores, encargos, IOF e juros.
- Se houver informação de parcela (ex: "PARC 03/10", "3/10", "PARCELA 3 DE 10"), extraia número e total.
- Retorne APENAS transações de compras reais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extraia todas as transações desta fatura:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_transactions",
              description: "Retorna a lista de transações extraídas da fatura do cartão de crédito.",
              parameters: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: {
                          type: "string",
                          description: "Data da transação no formato YYYY-MM-DD",
                        },
                        description: {
                          type: "string",
                          description: "Descrição/nome do estabelecimento",
                        },
                        amount: {
                          type: "number",
                          description: "Valor da transação em reais (positivo)",
                        },
                        installment_number: {
                          type: "number",
                          description: "Número da parcela atual (null se não parcelado)",
                        },
                        installment_total: {
                          type: "number",
                          description: "Total de parcelas (null se não parcelado)",
                        },
                      },
                      required: ["date", "description", "amount"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["transactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_transactions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", message: "Créditos de IA esgotados. Adicione créditos na sua workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "ai_error", message: "Erro ao processar fatura com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "parse_error", message: "IA não retornou dados estruturados" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ transactions: parsed.transactions || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice error:", e);
    return new Response(
      JSON.stringify({ error: "server_error", message: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
