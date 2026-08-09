export const PLUGGY_BASE = "https://api.pluggy.ai";

export async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais da Pluggy não configuradas");

  const res = await fetch(`${PLUGGY_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[${res.status}] Pluggy /auth: ${body}`);
  }
  const json = await res.json();
  return json.apiKey as string;
}

export async function pluggyFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${PLUGGY_BASE}${path}`, {
    ...init,
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[${res.status}] Pluggy ${path}: ${body}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}
