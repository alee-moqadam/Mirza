import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dashboardStats } from '../../../helpers/calculations.js'
import { filterAndSortRecords } from '../../../helpers/records.js'
import { createFinanceDataController } from '../../financeDataController.js'

const todayIso = () => new Date().toISOString().slice(0, 10)
const baseData = overrides => ({
  incomes: [],
  debts: [],
  currentExpenses: [],
  tags: [],
  expenseCategories: [{ id: 'cat-food', title: 'خوراک' }],
  incomeCategories: [{ id: 'cat-salary', title: 'حقوق' }],
  financialContacts: [],
  notifications: [],
  notificationSettings: { enabled: false, sentIds: [] },
  ...overrides,
})

function createMemoryController(initialData, options = {}) {
  let stored = structuredClone(initialData)
  const changes = []
  let reads = 0
  let writes = 0
  const controller = createFinanceDataController({
    read: () => {
      reads += 1
      return structuredClone(stored)
    },
    write: data => {
      writes += 1
      if (options.failWrite) throw new Error('write failed')
      stored = structuredClone(data)
    },
    initialData: structuredClone(stored),
    onChange: data => changes.push(structuredClone(data)),
    onError: () => {},
  })
  return {
    controller,
    changes,
    counts: () => ({ reads, writes }),
    stored: () => structuredClone(stored),
  }
}

test('after adding a record, the records list updates immediately', () => {
  const { controller } = createMemoryController(baseData())

  controller.mutateData(current => ({
    ...current,
    currentExpenses: [{ id: 'expense-1', title: 'Groceries', amount: 100, expenseDate: todayIso(), category: 'خوراک', status: 'پرداخت شده' }],
  }))

  assert.deepEqual(controller.getData().currentExpenses.map(item => item.id), ['expense-1'])
})

test('after editing a record, the list and dashboard summaries update immediately', () => {
  const { controller } = createMemoryController(baseData({
    currentExpenses: [{ id: 'expense-1', title: 'Groceries', amount: 100, expenseDate: todayIso(), category: 'خوراک', status: 'پرداخت شده' }],
  }))

  controller.mutateData(current => ({
    ...current,
    currentExpenses: current.currentExpenses.map(item => item.id === 'expense-1' ? { ...item, amount: 250 } : item),
  }))

  assert.equal(controller.getData().currentExpenses[0].amount, 250)
  assert.equal(dashboardStats(controller.getData()).totalExpense, 250)
})

test('after deleting a record, it disappears immediately', () => {
  const { controller } = createMemoryController(baseData({
    currentExpenses: [{ id: 'expense-1', title: 'Groceries', amount: 100, expenseDate: todayIso(), category: 'خوراک', status: 'پرداخت شده' }],
  }))

  controller.mutateData(current => ({
    ...current,
    currentExpenses: current.currentExpenses.filter(item => item.id !== 'expense-1'),
  }))

  assert.equal(controller.getData().currentExpenses.length, 0)
})

test('after marking a debt as paid, status and summaries update immediately', () => {
  const { controller } = createMemoryController(baseData({
    debts: [{ id: 'debt-1', title: 'Installment', amount: 400, dueDate: todayIso(), status: 'فعال', relation: 'پرداختنی' }],
  }))

  assert.equal(dashboardStats(controller.getData()).debts, 400)
  controller.mutateData(current => ({
    ...current,
    debts: current.debts.map(item => item.id === 'debt-1' ? { ...item, status: 'پرداخت شده' } : item),
  }))

  assert.equal(controller.getData().debts[0].status, 'پرداخت شده')
  assert.equal(dashboardStats(controller.getData()).debts, 0)
})

test('after changing tags, date, or category, filtered lists update immediately', () => {
  const { controller } = createMemoryController(baseData({
    currentExpenses: [{ id: 'expense-1', title: 'Groceries', amount: 100, expenseDate: todayIso(), dueDate: todayIso(), category: 'خوراک', tags: ['old'], status: 'پرداخت شده' }],
  }))

  controller.mutateData(current => ({
    ...current,
    currentExpenses: current.currentExpenses.map(item => item.id === 'expense-1'
      ? { ...item, category: 'حمل‌ونقل', tags: ['urgent'], dueDate: '2026-01-15' }
      : item),
  }))

  const filtered = filterAndSortRecords(controller.getData().currentExpenses, 'حمل‌ونقل', 'dueDate')
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].tags.includes('urgent'), true)
  assert.equal(filtered[0].dueDate, '2026-01-15')
})

test('refresh is not called in an infinite loop', () => {
  const { controller, changes, counts } = createMemoryController(baseData())

  controller.mutateData(current => ({ ...current, tags: [{ id: 'tag-1', title: 'ضروری' }] }))

  assert.equal(changes.length, 1)
  assert.deepEqual(counts(), { reads: 1, writes: 1 })
})

test('failed mutation does not incorrectly update UI as successful', () => {
  const { controller, changes, counts } = createMemoryController(baseData(), { failWrite: true })

  controller.mutateData(current => ({ ...current, tags: [{ id: 'tag-1', title: 'ضروری' }] }))

  assert.equal(controller.getData().tags.length, 0)
  assert.equal(changes.length, 0)
  assert.deepEqual(counts(), { reads: 0, writes: 1 })
})
