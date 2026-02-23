/**
 * Telegram bot: users send the password (TELEGRAM_BOT_PASSWORD) to receive leads.
 * Run with: TELEGRAM_BOT_TOKEN=xxx TELEGRAM_BOT_PASSWORD=thank_you_egor node api/bot.js
 * Keep this running (e.g. via PM2) so that when someone writes the password to the bot, their chat_id is added to authorized_chats.json.
 */

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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const PASSWORD = (process.env.TELEGRAM_BOT_PASSWORD || 'thank_you_egor').trim()
const AUTHORIZED_FILE = path.join(__dirname, 'authorized_chats.json')

function getAuthorizedChatIds() {
  try {
    const raw = fs.readFileSync(AUTHORIZED_FILE, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function addAuthorized(chatId) {
  const list = getAuthorizedChatIds()
  const id = typeof chatId === 'string' ? chatId.trim() : Number(chatId)
  if (list.includes(id)) return
  list.push(id)
  fs.writeFileSync(AUTHORIZED_FILE, JSON.stringify(list, null, 2), 'utf8')
}

function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).then((r) => r.json())
}

async function getUpdates(offset) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=30${offset ? `&offset=${offset}` : ''}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.ok) throw new Error(data.description || 'getUpdates failed')
  return data.result || []
}

async function run() {
  if (!BOT_TOKEN) {
    console.error('Set TELEGRAM_BOT_TOKEN')
    process.exit(1)
  }
  console.log('Bot running. Send the password to the bot in Telegram to receive leads.')
  let offset = 0
  for (;;) {
    try {
      const updates = await getUpdates(offset)
      for (const u of updates) {
        offset = u.update_id + 1
        const msg = u.message
        if (!msg?.text) continue
        const chatId = msg.chat?.id
        const text = (msg.text || '').trim()
        if (text === PASSWORD) {
          addAuthorized(chatId)
          await sendMessage(chatId, '✅ You are authorized. You will receive new leads here.')
        } else if (text === '/start') {
          await sendMessage(chatId, 'Send the password to receive configurator leads.')
        }
      }
    } catch (err) {
      console.error(err)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

run()
