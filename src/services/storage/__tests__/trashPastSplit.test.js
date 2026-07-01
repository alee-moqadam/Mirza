import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { dashboardStats } from '../../../helpers/calculations.js'
import {
  cleanRestoredRecord,
  createDeletedHistoryItem,
  filterRecordsByTimeTab,
  getDeletedRecordKey,
  getDeletedRecordsByType,
  getTrashSelectionState,
  groupDeletedRecordsByDeletedDate,
  isDeletedHistoryItem,
  isDeletedRecord,
  normalizeFinancialRecord,
  recordCompletionPatch,
} from '../../../helpers/records.js'

const debt = overrides => ({
  id: 'debt-1',
  title: 'قسط',
  amount: 1000,
  dueDate: '1405/01/15',
  relation: 'پرداختنی',
  status: 'فعال',
  ...overrides,
})

const income = overrides => ({
  id: 'income-1',
  title: 'حقوق',
  amount: 2000,
  receivedAmount: 0,
  dueDate: '1405/01/20',
  status: 'دریافت نشده',
  ...overrides,
})

test('paid debts appear in Debt past tab and unpaid debts stay active/current', () => {
  const paid = { ...debt(), ...recordCompletionPatch('debts', debt()) }
  const unpaid = debt({ id: 'debt-2', status: 'فعال' })

  assert.equal(paid.isDeleted, false)
  assert.equal(paid.deletedAt, '')
  assert.equal(paid.deletedReason, '')
  assert.equal(filterRecordsByTimeTab([paid, unpaid], 'past', 'debts').map(item => item.id).includes('debt-1'), true)
  assert.equal(filterRecordsByTimeTab([paid, unpaid], 'current', 'debts').map(item => item.id).includes('debt-2'), true)
  assert.equal(filterRecordsByTimeTab([paid, unpaid], 'current', 'debts').map(item => item.id).includes('debt-1'), false)
  assert.equal(isDeletedRecord(paid), false)
})

test('received incomes appear in Income past tab and unreceived incomes stay active/current', () => {
  const received = { ...income(), ...recordCompletionPatch('incomes', income()) }
  const expected = income({ id: 'income-2', status: 'دریافت نشده' })

  assert.equal(received.isDeleted, false)
  assert.equal(received.deletedAt, '')
  assert.equal(received.deletedReason, '')
  assert.equal(filterRecordsByTimeTab([received, expected], 'past', 'incomes').map(item => item.id).includes('income-1'), true)
  assert.equal(filterRecordsByTimeTab([received, expected], 'current', 'incomes').map(item => item.id).includes('income-2'), true)
  assert.equal(filterRecordsByTimeTab([received, expected], 'current', 'incomes').map(item => item.id).includes('income-1'), false)
})

test('completed histories are not treated as Trash items unless explicitly user-deleted', () => {
  const paidDebt = { ...debt({ id: 'paid-history' }), ...recordCompletionPatch('debts', debt()) }
  const receivedIncome = { ...income({ id: 'received-history' }), ...recordCompletionPatch('incomes', income()) }
  const completedCheck = { ...debt({ id: 'check-history', isCheck: true }), ...recordCompletionPatch('debts', debt({ isCheck: true })) }
  const completedRecurring = { ...debt({ id: 'recurring-history', isGenerated: true, recurrenceKey: 'rec-1:0' }), ...recordCompletionPatch('debts', debt()) }
  const histories = [
    { id: 'paid-history-row', entityType: 'debts', item: paidDebt, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'received-history-row', entityType: 'incomes', item: receivedIncome, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'check-history-row', entityType: 'debts', item: completedCheck, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'recurring-history-row', entityType: 'debts', item: completedRecurring, createdAt: '2026-01-01T00:00:00.000Z' },
    createDeletedHistoryItem('debts', debt({ id: 'real-delete' })),
  ]
  const trash = getDeletedRecordsByType(histories)

  assert.equal(histories.slice(0, 4).every(history => !isDeletedHistoryItem(history)), true)
  assert.equal(trash.debts.length, 1)
  assert.equal(trash.debts[0].item.id, 'real-delete')
  assert.equal(trash.incomes, undefined)
})

test('normalization clears accidental deleted flags from completed records without user delete reason', () => {
  const wronglyDeletedPaid = normalizeFinancialRecord({
    ...debt({ id: 'wrong-paid' }),
    status: 'پرداخت شده',
    paidAt: '2026-03-01T00:00:00.000Z',
    isDeleted: true,
    deletedAt: '2026-03-02T00:00:00.000Z',
    deletedFromType: 'debts',
  }, 'debts')
  const realDeletedPaid = normalizeFinancialRecord({
    ...debt({ id: 'real-paid-delete' }),
    status: 'پرداخت شده',
    paidAt: '2026-03-01T00:00:00.000Z',
    isDeleted: true,
    deletedAt: '2026-03-02T00:00:00.000Z',
    deletedFromType: 'debts',
    deletedReason: 'user_deleted',
  }, 'debts')

  assert.equal(wronglyDeletedPaid.isDeleted, false)
  assert.equal(wronglyDeletedPaid.deletedAt, '')
  assert.equal(isDeletedRecord(wronglyDeletedPaid), false)
  assert.equal(filterRecordsByTimeTab([wronglyDeletedPaid], 'past', 'debts').length, 1)
  assert.equal(isDeletedRecord(realDeletedPaid), true)
  assert.equal(filterRecordsByTimeTab([realDeletedPaid], 'past', 'debts').length, 0)
})

test('deleted debts and incomes are grouped in Trash and excluded from active and past tabs', () => {
  const deletedDebt = createDeletedHistoryItem('debts', debt()).item
  const deletedIncome = createDeletedHistoryItem('incomes', income()).item
  const trash = getDeletedRecordsByType([
    createDeletedHistoryItem('debts', debt({ id: 'debt-trash' })),
    createDeletedHistoryItem('incomes', income({ id: 'income-trash' })),
  ])

  assert.equal(filterRecordsByTimeTab([deletedDebt], 'current', 'debts').length, 0)
  assert.equal(filterRecordsByTimeTab([deletedDebt], 'past', 'debts').length, 0)
  assert.equal(filterRecordsByTimeTab([deletedIncome], 'current', 'incomes').length, 0)
  assert.equal(filterRecordsByTimeTab([deletedIncome], 'past', 'incomes').length, 0)
  assert.equal(trash.debts.length, 1)
  assert.equal(trash.incomes.length, 1)
})

test('restored records return to the correct past or active tab based on status', () => {
  const paidDebt = cleanRestoredRecord(createDeletedHistoryItem('debts', debt({ status: 'پرداخت شده', paidAt: '2026-03-01T00:00:00.000Z' })).item)
  const unpaidDebt = cleanRestoredRecord(createDeletedHistoryItem('debts', debt()).item)
  const receivedIncome = cleanRestoredRecord(createDeletedHistoryItem('incomes', income({ status: 'دریافت شده', receivedAt: '2026-03-01T00:00:00.000Z' })).item)
  const unreceivedIncome = cleanRestoredRecord(createDeletedHistoryItem('incomes', income()).item)

  assert.equal(filterRecordsByTimeTab([paidDebt], 'past', 'debts').length, 1)
  assert.equal(filterRecordsByTimeTab([unpaidDebt], 'current', 'debts').length, 1)
  assert.equal(filterRecordsByTimeTab([receivedIncome], 'past', 'incomes').length, 1)
  assert.equal(filterRecordsByTimeTab([unreceivedIncome], 'current', 'incomes').length, 1)
})

test('deleted records are excluded from normal dashboard totals while completed records remain reportable', () => {
  const paid = { ...debt(), ...recordCompletionPatch('debts', debt()) }
  const deleted = createDeletedHistoryItem('debts', debt({ id: 'deleted-debt', amount: 5000 })).item
  const stats = dashboardStats({ debts: [paid, deleted], incomes: [], currentExpenses: [] })

  assert.equal(stats.debts, 0)
  assert.equal(filterRecordsByTimeTab([paid], 'past', 'debts').length, 1)
})

test('header and settings expose Trash/Deleted Items instead of Archive labels', () => {
  const uiSource = readFileSync(new URL('../../../components/UI.jsx', import.meta.url), 'utf8')
  const settingsSource = readFileSync(new URL('../../../pages/Settings.jsx', import.meta.url), 'utf8')
  const trashSource = readFileSync(new URL('../../../pages/TrashPage.jsx', import.meta.url), 'utf8')
  const recordsSource = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')

  assert.equal(uiSource.includes('موارد حذف‌شده'), true)
  assert.equal(uiSource.includes("import { X, Plus, Search, Trash2"), true)
  assert.equal(uiSource.includes('آرشیو'), false)
  assert.equal(settingsSource.includes('موارد حذف‌شده'), true)
  assert.equal(settingsSource.includes("navigate?.('trash', 'all')"), true)
  assert.equal(trashSource.includes('getDeletedRecordsByType'), true)
  assert.equal(recordsSource.includes("navigate?.('trash', type)"), true)
})

test('trash timeline groups deleted records by Jalali deleted date with unknown fallback', () => {
  const first = createDeletedHistoryItem('debts', debt({ id: 'first' }))
  const second = createDeletedHistoryItem('incomes', income({ id: 'second' }))
  const unknown = createDeletedHistoryItem('debts', debt({ id: 'unknown' }))
  first.deletedAt = '2026-06-30T12:00:00.000Z'
  first.item.deletedAt = first.deletedAt
  second.deletedAt = '2026-07-01T08:00:00.000Z'
  second.item.deletedAt = second.deletedAt
  delete unknown.deletedAt
  delete unknown.item.deletedAt
  unknown.createdAt = ''

  const groups = groupDeletedRecordsByDeletedDate([first, unknown, second])

  assert.equal(groups[0].key, '2026-07-01')
  assert.equal(groups[1].key, '2026-06-30')
  assert.equal(groups[2].label, 'تاریخ حذف نامشخص')
})

test('trash selection state uses stable keys and switches select-all label', () => {
  const row = createDeletedHistoryItem('debts', debt({ id: 'stable-debt' }))

  assert.equal(getDeletedRecordKey(row), row.id)
  assert.equal(getTrashSelectionState([], 2).selectionActionLabel, 'انتخاب همه')
  assert.equal(getTrashSelectionState(['a'], 2).selectionActionLabel, 'انتخاب همه')
  assert.equal(getTrashSelectionState(['a', 'b'], 2).selectionActionLabel, 'لغو انتخاب')
})

test('trash page source has topbar back/manage actions, timeline headers, and no per-card deleted date metadata', () => {
  const source = readFileSync(new URL('../../../pages/TrashPage.jsx', import.meta.url), 'utf8')
  const cardSource = source.slice(source.indexOf('function TrashCard'))

  assert.equal(source.includes('trash-topbar'), true)
  assert.equal(source.includes('trash-title-group'), true)
  assert.equal(source.includes('trash-manage-btn'), true)
  assert.equal(source.includes('selectionMode ? closeSelection() : setSelectionMode(true)'), true)
  assert.equal(source.includes('groupDeletedRecordsByDeletedDate(rows)'), true)
  assert.equal(source.includes('trash-date-group'), true)
  assert.equal(source.includes('restoreSelected'), true)
  assert.equal(source.includes('permanentlyDeleteSelected'), true)
  assert.equal(cardSource.includes('تاریخ حذف'), false)
})

test('debt and income tabs use the normal expense-like flow with filters below', () => {
  const recordsSource = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')
  const styles = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8')

  assert.equal(recordsSource.includes('<StickyRecordTimeTabs'), false)
  assert.equal(recordsSource.includes('{hasTimeTabs && <RecordTimeTabs'), true)
  assert.equal(recordsSource.indexOf('{hasTimeTabs && <RecordTimeTabs') < recordsSource.indexOf('<RecordToolbar'), true)
  assert.equal(recordsSource.includes('<RecordToolbar type={type}'), true)
  assert.equal(recordsSource.includes('record-tabs--is-stuck'), false)
  assert.equal(recordsSource.includes('debt-time-tabs record-time-tabs'), true)
  assert.equal(recordsSource.includes('record-time-tabs--compact'), false)
  assert.equal(styles.includes('.record-time-tabs-sticky-wrap'), false)
  assert.equal(styles.includes('.record-time-tabs-sticky-wrap .record-time-tabs { margin: 0; }'), false)
  assert.equal(styles.includes('.record-filter-row { margin: 0 0 12px; display: flex;'), true)
  assert.equal(styles.includes('display: flex; flex-wrap: nowrap; width: 100%;'), true)
  assert.equal(styles.includes('flex: 1 1 0;'), true)
  assert.equal(styles.includes('.record-time-tabs--sticky'), false)
  assert.equal(styles.includes('.records-page--time-tabs { padding-top: var(--app-header-height); }'), false)
  assert.equal(recordsSource.includes('records-page--time-tabs'), false)
  assert.equal(styles.includes('margin: 0 -16px 10px;'), false)
  assert.equal(styles.includes('.record-tabs--is-stuck .record-time-tabs button'), false)
  assert.equal(styles.includes('text-overflow: ellipsis; white-space: nowrap;'), true)
})
