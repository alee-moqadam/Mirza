import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const cardSource = readFileSync(new URL('../../../components/records/RecordCard.jsx', import.meta.url), 'utf8')
const stylesSource = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8')

test('debt and check cards render a static divider instead of a progress bar', () => {
  assert.match(cardSource, /className="card-divider"/)
  assert.doesNotMatch(cardSource, /className="progress"/)
  assert.doesNotMatch(cardSource, /width:\s*`\$\{Math\.min\(100,\s*\(item\.paidCount/)
})

test('check cards do not render the income progress donut', () => {
  assert.match(cardSource, /type === 'incomes' && !item\.isCheck && <span className="mini-donut"/)
})

test('card divider uses a thin static line style', () => {
  assert.match(stylesSource, /\.card-divider\s*\{[^}]*height:\s*1px/)
  assert.match(stylesSource, /\.card-divider\s*\{[^}]*background:\s*var\(--line\)/)
  assert.doesNotMatch(stylesSource, /\.card-divider\s*\{[^}]*transition:/)
})
