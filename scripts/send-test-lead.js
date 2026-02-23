#!/usr/bin/env node
/**
 * Send a test lead to Formspree (egor@ubernatural.io).
 * Usage: node scripts/send-test-lead.js [FORMSPREE_ID]
 * Or set VITE_FORMSPREE_ID in .env in project root.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let formId = process.argv[2]
if (!formId) {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    const m = content.match(/^\s*VITE_FORMSPREE_ID\s*=\s*(.+)/m)
    if (m) formId = m[1].trim().replace(/^["']|["']$/g, '')
  }
}

if (!formId) {
  console.error('No Formspree form ID.')
  console.error('1) Create a form at https://formspree.io with email egor@ubernatural.io')
  console.error('2) Add to .env: VITE_FORMSPREE_ID=your_form_id')
  console.error('   Or run: node scripts/send-test-lead.js YOUR_FORM_ID')
  process.exit(1)
}

const body = {
  name: 'Test Sender',
  email: 'test@example.com',
  _subject: 'Configurator test — Corporate Site (7 pages)',
  submitted_at: new Date().toISOString(),
  goal: 'Corporate Site (7 pages)',
  scope: 'Cinematic',
  step3_type: 'Add options',
  total_days: 42,
  total_cost: 58000,
  reduce_options: '—',
  addons: 'Extensive Research +$1,300; Pay in installments +$3,900',
  _full_summary: 'Test lead from scripts/send-test-lead.js\nDate: ' + new Date().toLocaleString(),
}

const url = `https://formspree.io/f/${formId.trim()}`
console.log('Sending test lead to', url, '...')

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
  .then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new Error(t || res.statusText) })
    console.log('OK — check egor@ubernatural.io')
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
