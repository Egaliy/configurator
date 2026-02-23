/**
 * Submit lead to Telegram (via our API) or Formspree.
 * Telegram: set VITE_SEND_LEAD_API_URL to your api/send-lead endpoint (token stays on server).
 * Formspree: set VITE_FORMSPREE_ID (fallback).
 */

export interface LeadPayload {
  goal: string
  scope: string
  step3Type: 'reduce' | 'increase'
  reduceOptions: string[]
  addons: string[]
  totalDays: number
  totalCost: number
  fullSummary: string
}

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID as string | undefined
const SEND_LEAD_API_URL = (import.meta.env.VITE_SEND_LEAD_API_URL as string)?.trim()

export async function submitLead(name: string, email: string, payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  const body = {
    name,
    email,
    _subject: `Configurator: ${name} — ${payload.goal}`,
    submitted_at: new Date().toISOString(),
    goal: payload.goal,
    scope: payload.scope,
    step3_type: payload.step3Type === 'reduce' ? 'Reduce cost' : 'Add options',
    total_days: payload.totalDays,
    total_cost: payload.totalCost,
    reduce_options: payload.reduceOptions.length ? payload.reduceOptions.join('; ') : '—',
    addons: payload.addons.length ? payload.addons.join('; ') : '—',
    _full_summary: payload.fullSummary,
  }

  if (SEND_LEAD_API_URL) {
    try {
      const res = await fetch(SEND_LEAD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return { ok: false, error: (data as { error?: string }).error || res.statusText }
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { ok: false, error: message }
    }
  }

  if (!FORMSPREE_ID?.trim()) {
    console.warn('VITE_SEND_LEAD_API_URL and VITE_FORMSPREE_ID not set — lead will not be sent.')
    return { ok: true }
  }

  const formspreeBody: Record<string, string | number> = { ...body }
  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formspreeBody),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || res.statusText }
    }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: message }
  }
}
