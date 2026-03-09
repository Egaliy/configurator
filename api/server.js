/**
 * Telegram lead endpoint. Sends leads only to chat_ids that have authorized in the bot (entered password).
 * Run with: TELEGRAM_BOT_TOKEN=xxx node api/server.js
 * Also run api/bot.js so users can send the password to the bot to get authorized.
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const PORT = process.env.PORT || 3001
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const AUTHORIZED_FILE = path.join(__dirname, 'authorized_chats.json')

function getAuthorizedChatIds() {
  try {
    const raw = fs.readFileSync(AUTHORIZED_FILE, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((id) => typeof id === 'number' || (typeof id === 'string' && id.trim() !== '')) : []
  } catch {
    return []
  }
}

function sendToTelegram(chatId, text) {
  if (!BOT_TOKEN) return Promise.reject(new Error('TELEGRAM_BOT_TOKEN not set'))
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
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

const server = http.createServer(async (req, res) => {
  const allowCors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, allowCors)
    res.end()
    return
  }

  if (req.method !== 'POST' || !req.url.startsWith('/api/send-lead')) {
    res.writeHead(404, { 'Content-Type': 'text/plain', ...allowCors })
    res.end('Not found')
    return
  }

  let body = ''
  for await (const chunk of req) body += chunk
  let data
  try {
    data = JSON.parse(body || '{}')
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json', ...allowCors })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
    return
  }

  const chatIds = getAuthorizedChatIds()
  const text = formatLead(data)

  if (chatIds.length === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json', ...allowCors })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  const errors = []
  for (const chatId of chatIds) {
    try {
      await sendToTelegram(chatId, text)
    } catch (err) {
      errors.push(String(err.message))
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json', ...allowCors })
  res.end(JSON.stringify({ ok: true, errors: errors.length ? errors : undefined }))
})

server.listen(PORT, () => {
  console.log(`Telegram lead API on http://localhost:${PORT}/api/send-lead`)
  console.log('Leads are sent only to authorized chats (password entered in the bot).')
  if (!BOT_TOKEN) console.warn('Warn: TELEGRAM_BOT_TOKEN not set')
})
