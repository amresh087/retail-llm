import { API_BASE } from "../config/apiConfig";

export async function sendMessage(message: string) {
  // Use Vite env variable `VITE_AI_SERVICE_URL` (recommended) or API_BASE from config.
  const viteEnv: any = (import.meta as any)?.env;
  const base = API_BASE?.BASE_URL || viteEnv?.VITE_AI_SERVICE_URL || '';
  // Use the intent endpoint as requested by the user
  const url = (base ? base.replace(/\/$/, '') : '') + '/ai/intent';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const token = JSON.parse(stored).token;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command: message }),
    credentials: 'include'
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `AI service error: ${res.status}`);
  }

  return res.json();
}
