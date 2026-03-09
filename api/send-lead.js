/**
 * Vercel Serverless: POST /api/send-lead — отправка заявки в Telegram.
 * В настройках проекта Vercel задайте:
 *   TELEGRAM_BOT_TOKEN — токен бота
 *   TELEGRAM_AUTHORIZED_CHAT_IDS — через запятую chat_id (например 328826190)
 * Бот для добавления новых chat_id по паролю остаётся на VPS (api/bot.js).
 */

function sendToTelegram(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  }).then((r) => {
    if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j.description || r.statusText)))
    return r.json()
  })
}

function formatLead(body) {
  const d = body
  const lines = [
    '<b>New configurator lead</b>',
    '',
    `<b>Name:</b> ${d.name || '—'}`,
    `<b>Email:</b> ${d.email || '—'}`,
    `<b>Preferred:</b> ${d.preferred_contact || '—'}`,
    ...(d.project_description ? [`<b>Project:</b> ${(d.project_description || '').slice(0, 300)}${(d.project_description || '').length > 300 ? '…' : ''}`] : []),
    ...(d.project_site_url ? [`<b>Site:</b> ${d.project_site_url}`] : []),
    `<b>Submitted:</b> ${d.submitted_at || new Date().toISOString()}`,
    '',
    `<b>Goal:</b> ${d.goal || '—'}`,
    `<b>Scope:</b> ${d.scope || '—'}`,
    `<b>Step 3:</b> ${d.step3_type || '—'}`,
    `<b>Reduce options:</b> ${d.reduce_options || '—'}`,
    `<b>Addons:</b> ${d.addons || '—'}`,
    '',
    `<b>Total:</b> ${d.total_days ?? '—'} work days, $${(d.total_cost ?? 0).toLocaleString()}`,
  ]
  return lines.join('\n')
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(404).setHeader('Content-Type', 'text/plain').end('Not found')
    return
  }

  let data = req.body
  if (typeof data !== 'object' || data === null) {
    try {
      data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : {}
    } catch {
      res.status(400).json({ error: 'Invalid JSON' })
      return
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const idsStr = process.env.TELEGRAM_AUTHORIZED_CHAT_IDS || ''
  const chatIds = idsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((id) => (Number(id) ? Number(id) : id))

  const text = formatLead(data)

  if (!botToken) {
    res.status(200).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set in Vercel' })
    return
  }

  if (chatIds.length === 0) {
    res.status(200).json({ ok: false, error: 'TELEGRAM_AUTHORIZED_CHAT_IDS not set in Vercel' })
    return
  }

  const errors = []
  for (const chatId of chatIds) {
    try {
      await sendToTelegram(botToken, chatId, text)
    } catch (err) {
      errors.push(String(err.message))
    }
  }
  res.status(200).json({ ok: true, errors: errors.length ? errors : undefined })
}
