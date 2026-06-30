import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyRecordFilters,
  filterAndSortRecords,
  filterRecordsByTimeTab,
  normalizeFinancialRecord,
  prepareRecord,
} from '../../../helpers/records.js'

test('edited income with a new date and tags remains in the income collection and visible', () => {
  const edited = prepareRecord({
    id: 'income-1',
    legacyCollection: 'incomes',
    title: 'Income',
    amount: '1200',
    incomeType: 'فقط یک‌بار',
    dueDate: '1405/05/10',
    category: 'حقوق',
    tagsText: 'جدید, مهم',
    receivedAmount: 0,
    metadata: { old: true },
  }, 'incomes')

  assert.equal(edited.legacyCollection, 'incomes')
  assert.equal(edited.incomeType, 'فقط یک‌بار')
  assert.deepEqual(edited.tags, ['جدید', 'مهم'])
  assert.equal(edited.metadata.old, true)
  assert.equal(filterAndSortRecords([edited], 'همه', 'dueDate').length, 1)
  assert.equal(filterRecordsByTimeTab([edited], 'future').length, 1)
})

test('edited debt with a new date and tags remains in the debt collection and visible', () => {
  const edited = prepareRecord({
    id: 'debt-1',
    legacyCollection: 'debts',
    title: 'Debt',
    amount: '2500',
    relation: 'پرداختنی',
    dueDate: '1405/05/10',
    tagsText: 'قسط, مهم',
    sync: { old: true },
  }, 'debts')

  assert.equal(edited.legacyCollection, 'debts')
  assert.equal(edited.relation, 'پرداختنی')
  assert.equal(edited.direction, 'payable')
  assert.deepEqual(edited.tags, ['قسط', 'مهم'])
  assert.equal(edited.metadata.old, true)
  assert.equal(filterAndSortRecords([edited], 'همه', 'dueDate').length, 1)
  assert.equal(filterRecordsByTimeTab([edited], 'future').length, 1)
})

test('records without tags and with legacy date strings remain visible', () => {
  const record = normalizeFinancialRecord({
    id: 'legacy-date',
    title: 'Legacy',
    amount: '100',
    relation: 'دریافتنی',
    dueDate: '1405/01/15',
  }, 'debts')

  assert.deepEqual(record.tags, [])
  assert.equal(record.dueDate, '2026-04-04')
  assert.equal(applyRecordFilters([record], { tags: [], tagFilter: '', dateFrom: '', dateTo: '' }, 'debts').length, 1)
})

test('tag filters only apply when explicitly selected', () => {
  const record = normalizeFinancialRecord({
    id: 'no-tags',
    title: 'No tags',
    amount: 100,
    dueDate: '2026-04-04',
  }, 'incomes')

  assert.equal(applyRecordFilters([record], { tagFilter: '', tags: [] }, 'incomes').length, 1)
  assert.equal(applyRecordFilters([record], { tagFilter: 'missing', tags: [] }, 'incomes').length, 0)
})

test('date filters do not drop valid records when no date range is active', () => {
  const record = normalizeFinancialRecord({
    id: 'bad-date',
    title: 'Bad date',
    amount: 100,
    dueDate: 'not-a-date',
  }, 'debts')

  assert.equal(applyRecordFilters([record], { dateFrom: '', dateTo: '' }, 'debts').length, 1)
})
