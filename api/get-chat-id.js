#!/usr/bin/env node
/**
 * Get your Telegram chat_id. Run after messaging your bot (e.g. /start).
 * Usage: TELEGRAM_BOT_TOKEN=your_token node api/get-chat-id.js
 */

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN')
  process.exit(1)
}

const url = `https://api.telegram.org/bot${token}/getUpdates`
const res = await fetch(url)
const data = await res.json()
if (!data.ok) {
  console.error(data)
  process.exit(1)
}
const updates = data.result || []
if (updates.length === 0) {
  console.log('No messages yet. Send /start to your bot in Telegram, then run this again.')
  process.exit(0)
}
const chatId = updates[updates.length - 1].message?.chat?.id
if (chatId) console.log('TELEGRAM_CHAT_ID=' + chatId)
else console.log('Could not get chat_id from updates:', JSON.stringify(updates, null, 2))
