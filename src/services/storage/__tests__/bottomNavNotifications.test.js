import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  clearSectionUnseen,
  getAffectedNavSections,
  isSectionUnseen,
  markSectionsUnseen,
} from '../../../helpers/navNotifications.js'

const bottomNavSource = readFileSync(new URL('../../../components/BottomNav.jsx', import.meta.url), 'utf8')
const stylesSource = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8')

test('bottom nav no longer renders numeric badge text', () => {
  assert.doesNotMatch(bottomNavSource, /formatNumber/)
  assert.doesNotMatch(bottomNavSource, /alertCount/)
  assert.doesNotMatch(bottomNavSource, /<i>\{/)
})

test('bottom nav renders a non-numeric dot marker for unseen sections', () => {
  assert.match(bottomNavSource, /unseenSections\[id\]\s*&&\s*<i aria-hidden="true" \/>/)
  assert.match(stylesSource, /\.nav-icon i\s*\{[^}]*width:\s*8px/)
  assert.match(stylesSource, /\.nav-icon i\s*\{[^}]*font-size:\s*0/)
})

test('opening the affected page clears only that page dot', () => {
  const state = { debts: true, incomes: true }
  const next = clearSectionUnseen(state, 'debts')

  assert.equal(isSectionUnseen(next, 'debts'), false)
  assert.equal(isSectionUnseen(next, 'incomes'), true)
})

test('opening another page does not clear unrelated dots', () => {
  const state = { debts: true, incomes: true }
  const next = clearSectionUnseen(state, 'settings')

  assert.equal(isSectionUnseen(next, 'debts'), true)
  assert.equal(isSectionUnseen(next, 'incomes'), true)
})

test('new mutation after clearing re-triggers the marker', () => {
  const cleared = clearSectionUnseen({ debts: true }, 'debts')
  const next = markSectionsUnseen(cleared, ['debts'], 'dashboard')

  assert.equal(isSectionUnseen(next, 'debts'), true)
})

test('mutation on the currently active page does not create an unnecessary dot', () => {
  const next = markSectionsUnseen({}, ['debts', 'dashboard'], 'debts')

  assert.equal(isSectionUnseen(next, 'debts'), false)
  assert.equal(isSectionUnseen(next, 'dashboard'), true)
})

test('affected nav sections are based on changed collections, not item counts', () => {
  const previous = { debts: [{ id: 'debt-1' }], incomes: [], currentExpenses: [] }
  const next = { debts: [{ id: 'debt-1' }, { id: 'debt-2' }], incomes: [], currentExpenses: [] }

  assert.deepEqual(getAffectedNavSections(previous, next).sort(), ['dashboard', 'debts'])
})

test('notification center source remains present', () => {
  const notificationsSheetSource = readFileSync(new URL('../../../components/NotificationsSheet.jsx', import.meta.url), 'utf8')

  assert.match(notificationsSheetSource, /notifications = data\.notifications/)
  assert.match(notificationsSheetSource, /markRead/)
})
