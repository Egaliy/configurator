#!/usr/bin/env node
/**
 * Test lead submission to the deployed API.
 * Usage: node scripts/test-lead-api.js [BASE_URL]
 * Example: node scripts/test-lead-api.js http://130.49.149.162
 * If BASE_URL has /configurator, use http://130.49.149.162 (API is usually at origin/api/send-lead).
 */
const base = process.argv[2] || 'http://130.49.149.162'
const url = base.replace(/\/$/, '') + '/api/send-lead'

const body = {
  name: 'Test User',
  email: 'test@example.com',
  _subject: 'Configurator: Test User — Test',
  submitted_at: new Date().toISOString(),
  goal: 'Test',
  scope: 'Test',
  step3_type: 'Add options',
  total_days: 10,
  total_cost: 5000,
  reduce_options: '—',
  addons: '—',
  _full_summary: 'Script test',
}

async function main() {
  console.log('POST', url)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log('Status:', res.status, res.statusText)
    console.log('Response:', text)
    if (!res.ok) console.error('API returned error')
  } catch (e) {
    console.error('Request failed:', e.message)
  }
}

main()
