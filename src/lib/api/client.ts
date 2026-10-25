export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.ok || body.data === undefined) {
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  }
  return body.data;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function formatPercent(value: number | null | undefined): string {
  return `${Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100)}%`;
}
