import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nextDueDate } from '../../../helpers/dates.js'
import {
  deriveDebtListRecords,
  generateDebtOccurrencesForParent,
  getDebtScheduleAnchor,
} from '../../../helpers/recurrence.js'

const recurringDebt = overrides => ({
  id: 'debt-1',
  title: 'Recurring debt',
  amount: 1000,
  relation: 'پرداختنی',
  isPeriodic: true,
  recurrence: 'ماهانه',
  startDate: '2026-01-01',
  dueDate: '2026-03-15',
  status: 'فعال',
  ...overrides,
})

test('payment period is calculated from startDate, not dueDate', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt(), {
    rangeEnd: '2026-04-30',
    maxOccurrences: 6,
  })

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), [
    '2026-01-01',
    '2026-02-01',
    '2026-03-01',
    '2026-04-01',
  ])
  assert.equal(nextDueDate(recurringDebt()), '2026-04-01')
})

test('changing dueDate does not change the recurrence anchor', () => {
  const first = generateDebtOccurrencesForParent(recurringDebt({ dueDate: '2026-03-15' }), { rangeEnd: '2026-03-30' })
  const changedDueDate = generateDebtOccurrencesForParent(recurringDebt({ dueDate: '2026-03-28' }), { rangeEnd: '2026-03-30' })

  assert.deepEqual(changedDueDate.map(item => item.occurrenceDate), first.map(item => item.occurrenceDate))
  assert.equal(getDebtScheduleAnchor(recurringDebt({ dueDate: '2026-03-28' })), '2026-01-01')
})

test('monthly recurrence generates stable Debt list occurrences', () => {
  const list = deriveDebtListRecords([recurringDebt()], { rangeEnd: '2026-03-30' })

  assert.deepEqual(list.map(item => item.dueDate), ['2026-01-01', '2026-02-01', '2026-03-01'])
  assert.deepEqual(list.map(item => item.recurrenceKey), ['debt-1:2026-01-01', 'debt-1:2026-02-01', 'debt-1:2026-03-01'])
  assert.ok(list.every(item => item.isGenerated && item.parentDebtId === 'debt-1'))
})

test('every-2-month recurrence generates the correct occurrences', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ recurrence: 'دوماهه' }), {
    rangeEnd: '2026-08-30',
  })

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), [
    '2026-01-01',
    '2026-03-01',
    '2026-05-01',
    '2026-07-01',
  ])
})

test('monthly recurrence handles month-end dates without timezone day shifts', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({
    startDate: '2026-01-31',
    dueDate: '2026-02-15',
  }), {
    rangeEnd: '2026-04-30',
  })

  assert.deepEqual(occurrences.map(item => item.occurrenceDate), [
    '2026-01-31',
    '2026-02-28',
    '2026-03-31',
    '2026-04-30',
  ])
  assert.equal(nextDueDate(recurringDebt({ startDate: '2026-01-31', dueDate: '2026-02-15' })), '2026-02-28')
})

test('generated debt records are not duplicated after repeated reads', () => {
  const first = deriveDebtListRecords([recurringDebt()], { rangeEnd: '2026-03-30' })
  const second = deriveDebtListRecords([recurringDebt()], { rangeEnd: '2026-03-30' })

  assert.deepEqual(second.map(item => item.id), first.map(item => item.id))
  assert.equal(new Set(second.map(item => item.recurrenceKey)).size, second.length)
})

test('paid generated records are not reset when parent recurring debt is edited', () => {
  const paidOccurrence = {
    ...generateDebtOccurrencesForParent(recurringDebt(), { rangeEnd: '2026-02-01' })[1],
    status: 'پرداخت شده',
    paidCount: 1,
  }
  const editedParent = recurringDebt({ amount: 1500, title: 'Edited recurring debt' })
  const list = deriveDebtListRecords([editedParent, paidOccurrence], { rangeEnd: '2026-03-30' })
  const February = list.find(item => item.occurrenceDate === '2026-02-01')
  const March = list.find(item => item.occurrenceDate === '2026-03-01')

  assert.equal(February.status, 'پرداخت شده')
  assert.equal(February.paidCount, 1)
  assert.equal(February.amount, 1000)
  assert.equal(March.amount, 1500)
})

test('legacy debts without startDate safely fall back to dueDate', () => {
  const legacyDebt = recurringDebt({ startDate: '', dueDate: '2026-03-15' })
  const occurrences = generateDebtOccurrencesForParent(legacyDebt, { rangeEnd: '2026-05-30' })

  assert.equal(getDebtScheduleAnchor(legacyDebt), '2026-03-15')
  assert.deepEqual(occurrences.map(item => item.occurrenceDate), ['2026-03-15', '2026-04-15', '2026-05-15'])
})
