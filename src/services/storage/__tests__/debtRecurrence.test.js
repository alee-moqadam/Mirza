import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { isoToJalali, nextDueDate } from '../../../helpers/dates.js'
import { filterRecordsByTimeTab } from '../../../helpers/records.js'
import {
  calculateOccurrenceDueDate,
  createRecurringDebtParent,
  deleteRecurringOccurrences,
  deriveDebtListRecords,
  generateDebtOccurrencesForParent,
  getOccurrenceKey,
  getDebtScheduleAnchor,
  getRecurringDeleteSelectionState,
  reconcileRecurringDebtOccurrences,
  restoreRecurringOccurrence,
} from '../../../helpers/recurrence.js'
import { dashboardStats } from '../../../helpers/calculations.js'

const toJalaliList = records => records.map(item => isoToJalali(item.dueDate))
const toJalaliOccurrenceDates = records => records.map(item => isoToJalali(item.occurrenceDate))

const recurringDebt = overrides => ({
  id: 'debt-1',
  title: 'Recurring debt',
  amount: 1000,
  relation: 'پرداختنی',
  isPeriodic: true,
  recurrence: 'ماهانه',
  startDate: '1405/01/01',
  dueDate: '1405/01/15',
  endDate: '1405/12/29',
  status: 'فعال',
  ...overrides,
})

test('Jalali monthly range 1405/01/01 to 1405/12/29 generates 12 occurrences', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt())

  assert.equal(occurrences.length, 12)
  assert.deepEqual(toJalaliOccurrenceDates(occurrences), [
    '1405/01/01',
    '1405/02/01',
    '1405/03/01',
    '1405/04/01',
    '1405/05/01',
    '1405/06/01',
    '1405/07/01',
    '1405/08/01',
    '1405/09/01',
    '1405/10/01',
    '1405/11/01',
    '1405/12/01',
  ])
  assert.deepEqual(toJalaliList(occurrences), [
    '1405/01/15',
    '1405/02/15',
    '1405/03/15',
    '1405/04/15',
    '1405/05/15',
    '1405/06/15',
    '1405/07/15',
    '1405/08/15',
    '1405/09/15',
    '1405/10/15',
    '1405/11/15',
    '1405/12/15',
  ])
  assert.equal(new Set(occurrences.map(item => item.dueDate)).size, 12)
})

test('Jalali every-2-month range 1405/01/01 to 1405/12/29 generates 6 occurrences', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ recurrence: 'دوماهه' }))

  assert.equal(occurrences.length, 6)
  assert.deepEqual(toJalaliList(occurrences), [
    '1405/01/15',
    '1405/03/15',
    '1405/05/15',
    '1405/07/15',
    '1405/09/15',
    '1405/11/15',
  ])
})

test('Jalali every-3-month range 1405/01/01 to 1405/12/29 generates 4 occurrences', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ recurrence: 'سه‌ماهه' }))

  assert.equal(occurrences.length, 4)
  assert.deepEqual(toJalaliList(occurrences), ['1405/01/15', '1405/04/15', '1405/07/15', '1405/10/15'])
})

test('Jalali monthly shorter range 1405/01/01 to 1405/06/31 generates 6 occurrences', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ endDate: '1405/06/31' }))

  assert.equal(occurrences.length, 6)
  assert.deepEqual(toJalaliList(occurrences), [
    '1405/01/15',
    '1405/02/15',
    '1405/03/15',
    '1405/04/15',
    '1405/05/15',
    '1405/06/15',
  ])
})

test('installment count is used only when endDate is missing', () => {
  const byEndDate = generateDebtOccurrencesForParent(recurringDebt({ loanDurationMonths: 3 }))
  const byCount = generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 3 }))

  assert.equal(byEndDate.length, 12)
  assert.equal(byCount.length, 3)
})

test('duration count generates exactly 1, 2, 6, and 12 occurrences when endDate is missing', () => {
  assert.equal(generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 1 })).length, 1)
  assert.equal(generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 2 })).length, 2)
  assert.equal(generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 6 })).length, 6)
  assert.equal(generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 12 })).length, 12)
})

test('monthly 6-month duration produces due dates through 1405/06/15 only', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ endDate: '', loanDurationMonths: 6 }))

  assert.deepEqual(toJalaliList(occurrences), ['1405/01/15', '1405/02/15', '1405/03/15', '1405/04/15', '1405/05/15', '1405/06/15'])
  assert.equal(toJalaliList(occurrences).includes('1405/07/15'), false)
  assert.equal(occurrences.at(-1).occurrenceIndex, 5)
})

test('editing an existing recurring debt to a 6-month duration leaves exactly 6 active children', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ endDate: '', loanDurationMonths: 12 }) })
  const edited = reconcileRecurringDebtOccurrences({
    parentDebt: recurringDebt({ endDate: '', loanDurationMonths: 6 }),
    existingOccurrences: initial.children,
  })
  const list = deriveDebtListRecords(edited.records)

  assert.equal(list.length, 6)
  assert.equal(toJalaliList(list).includes('1405/07/15'), false)
})

test('generated due dates are displayed as Jalali dates and are not copied unchanged', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({ recurrence: 'دوماهه' }))

  assert.notDeepEqual(toJalaliList(occurrences), Array(occurrences.length).fill('1405/01/15'))
  assert.deepEqual(toJalaliList(occurrences), ['1405/01/15', '1405/03/15', '1405/05/15', '1405/07/15', '1405/09/15', '1405/11/15'])
})

test('changing dueDate does not change the recurrence anchor but changes occurrence due dates', () => {
  const first = generateDebtOccurrencesForParent(recurringDebt({ dueDate: '1405/03/15' }), { rangeEnd: '1405/03/30' })
  const changedDueDate = generateDebtOccurrencesForParent(recurringDebt({ dueDate: '1405/03/28' }), { rangeEnd: '1405/03/30' })

  assert.deepEqual(changedDueDate.map(item => item.occurrenceDate), first.map(item => item.occurrenceDate))
  assert.deepEqual(toJalaliList(changedDueDate), ['1405/03/28', '1405/04/28', '1405/05/28'])
  assert.equal(isoToJalali(getDebtScheduleAnchor(recurringDebt({ dueDate: '1405/03/28' }))), '1405/01/01')
})

test('monthly recurrence generates stable Debt list occurrences without duplicates', () => {
  const first = deriveDebtListRecords([recurringDebt()], { rangeEnd: '1405/03/30' })
  const second = deriveDebtListRecords([recurringDebt()], { rangeEnd: '1405/03/30' })

  assert.deepEqual(toJalaliList(first), ['1405/01/15', '1405/02/15', '1405/03/15'])
  assert.deepEqual(toJalaliOccurrenceDates(first), ['1405/01/01', '1405/02/01', '1405/03/01'])
  assert.deepEqual(second.map(item => item.id), first.map(item => item.id))
  assert.equal(new Set(second.map(item => item.recurrenceKey)).size, second.length)
  assert.ok(first.every(item => item.isGenerated && item.parentDebtId === 'debt-1'))
})

test('creating a recurring monthly debt stores one parent and 12 generated children', () => {
  const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: createRecurringDebtParent(recurringDebt()) })

  assert.equal(reconciled.records.filter(item => item.isRecurringParent).length, 1)
  assert.equal(reconciled.records.filter(item => item.isRecurringChild).length, 12)
  assert.deepEqual(toJalaliList(reconciled.children), [
    '1405/01/15',
    '1405/02/15',
    '1405/03/15',
    '1405/04/15',
    '1405/05/15',
    '1405/06/15',
    '1405/07/15',
    '1405/08/15',
    '1405/09/15',
    '1405/10/15',
    '1405/11/15',
    '1405/12/15',
  ])
})

test('Debt list shows recurring children as separate records and does not include parent as duplicate payment', () => {
  const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const list = deriveDebtListRecords(reconciled.records)

  assert.equal(list.length, 12)
  assert.equal(list.some(item => item.isRecurringParent), false)
  assert.equal(list.every(item => item.isRecurringChild), true)
})

test('month-end Jalali due dates clamp to the target Jalali month length', () => {
  const occurrences = generateDebtOccurrencesForParent(recurringDebt({
    dueDate: '1405/01/31',
    endDate: '1405/04/31',
  }))

  assert.deepEqual(toJalaliList(occurrences), ['1405/01/31', '1405/02/31', '1405/03/31', '1405/04/31'])
  assert.equal(isoToJalali(calculateOccurrenceDueDate('1405/06/31', 1, 'ماهانه')), '1405/07/30')
})

test('weekly and yearly due date calculation uses existing recurrence values', () => {
  assert.equal(isoToJalali(calculateOccurrenceDueDate('1405/01/15', 2, 'هفتگی')), '1405/01/29')
  assert.equal(isoToJalali(calculateOccurrenceDueDate('1405/12/29', 1, 'سالانه')), '1406/12/29')
})

test('nextDueDate advances from the current due date using Jalali month math', () => {
  assert.equal(isoToJalali(nextDueDate(recurringDebt({ dueDate: '1405/01/15' }))), '1405/02/15')
})

test('paid generated records are not reset when parent recurring debt is edited', () => {
  const paidOccurrence = {
    ...generateDebtOccurrencesForParent(recurringDebt(), { rangeEnd: '1405/02/15' })[1],
    status: 'پرداخت شده',
    paidCount: 1,
  }
  const editedParent = recurringDebt({ amount: 1500, title: 'Edited recurring debt' })
  const list = deriveDebtListRecords([editedParent, paidOccurrence], { rangeEnd: '1405/03/30' })
  const second = list.find(item => item.occurrenceIndex === 1)
  const third = list.find(item => item.occurrenceIndex === 2)

  assert.equal(second.status, 'پرداخت شده')
  assert.equal(second.paidCount, 1)
  assert.equal(second.amount, 1500)
  assert.equal(third.amount, 1500)
})

test('editing one generated child updates parent shared fields and all children in the same series', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const editedChild = { ...initial.children[1], title: 'Edited recurring series', amount: 1800, tags: ['ضروری'], category: 'وام' }
  const editedParent = createRecurringDebtParent({ ...initial.parent, ...editedChild, id: initial.parent.id, parentDebtId: '' })
  const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: editedParent, existingOccurrences: initial.children })

  assert.equal(reconciled.parent.title, 'Edited recurring series')
  assert.equal(reconciled.parent.amount, 1800)
  assert.equal(reconciled.children.length, 12)
  assert.equal(reconciled.children.every(child => child.title === 'Edited recurring series'), true)
  assert.equal(reconciled.children.every(child => child.amount === 1800), true)
  assert.equal(reconciled.children.every(child => child.tags.includes('ضروری')), true)
})

test('editing parent debt shortens 12 monthly occurrences to 6 without active stale future debts', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const paidOutsideShortenedSchedule = { ...initial.children[8], status: 'پرداخت شده', paidCount: 1 }
  const shortenedParent = recurringDebt({ endDate: '1405/06/31', amount: 1500 })
  const reconciled = reconcileRecurringDebtOccurrences({
    parentDebt: shortenedParent,
    existingOccurrences: [...initial.children.slice(0, 8), paidOutsideShortenedSchedule],
  })
  const list = deriveDebtListRecords(reconciled.records)

  assert.equal(list.filter(item => item.parentDebtId === 'debt-1').length, 6)
  assert.deepEqual(toJalaliList(list.filter(item => item.parentDebtId === 'debt-1')), [
    '1405/01/15',
    '1405/02/15',
    '1405/03/15',
    '1405/04/15',
    '1405/05/15',
    '1405/06/15',
  ])
  assert.equal(reconciled.records.some(item => item.recurrenceKey === paidOutsideShortenedSchedule.recurrenceKey && item.status === 'پرداخت شده' && item.archived), true)
})

test('extending a 6-month recurring series to 12 months creates missing future children', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ endDate: '1405/06/31' }) })
  const extended = reconcileRecurringDebtOccurrences({
    parentDebt: recurringDebt({ endDate: '1405/12/29' }),
    existingOccurrences: initial.children,
  })

  assert.equal(initial.children.length, 6)
  assert.equal(extended.children.length, 12)
  assert.deepEqual(toJalaliList(extended.children).slice(6), ['1405/07/15', '1405/08/15', '1405/09/15', '1405/10/15', '1405/11/15', '1405/12/15'])
})

test('dashboard summaries use child occurrence due dates and do not count recurring parent', () => {
  const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ amount: 1000 }) })
  const stats = dashboardStats({ debts: reconciled.records, incomes: [], currentExpenses: [] })

  assert.equal(stats.debts, 12000)
})

test('deleted generated debt occurrence is hidden from current and future time tabs', () => {
  const deletedOccurrence = {
    ...generateDebtOccurrencesForParent(recurringDebt(), { rangeEnd: '1405/02/15' })[1],
    status: 'لغوشده',
    deletedAt: '2026-04-20T00:00:00.000Z',
  }
  const list = deriveDebtListRecords([recurringDebt(), deletedOccurrence], { rangeEnd: '1405/03/30' })
  const second = list.find(item => item.occurrenceIndex === 1)

  assert.equal(second.status, 'لغوشده')
  assert.equal(filterRecordsByTimeTab(list, 'current', 'debts').some(item => item.recurrenceKey === second.recurrenceKey), false)
  assert.equal(filterRecordsByTimeTab(list, 'future', 'debts').some(item => item.recurrenceKey === second.recurrenceKey), false)
})

test('deleting a standalone debt deletes only that record', () => {
  const standalone = { id: 'standalone-1', title: 'Standalone', amount: 100, dueDate: '1405/01/15' }
  const other = { id: 'standalone-2', title: 'Other', amount: 200, dueDate: '1405/01/16' }
  const next = deleteRecurringOccurrences({ records: [standalone, other], targetRecord: standalone })

  assert.deepEqual(next.map(item => item.id), ['standalone-2'])
})

test('deleting one middle child occurrence excludes only that occurrence', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const middle = initial.children[5]
  const middleKey = getOccurrenceKey(middle)
  const laterBefore = initial.children[6]
  const nextRecords = deleteRecurringOccurrences({
    records: initial.records,
    targetRecord: middle,
    occurrenceKeys: [middleKey],
  })
  const list = deriveDebtListRecords(nextRecords)
  const parent = nextRecords.find(item => item.isRecurringParent)
  const laterAfter = list.find(item => item.occurrenceIndex === laterBefore.occurrenceIndex)

  assert.equal(parent.excludedOccurrenceKeys.includes(middleKey), true)
  assert.equal(list.some(item => getOccurrenceKey(item) === middleKey), false)
  assert.equal(list.length, 11)
  assert.equal(isoToJalali(laterAfter.dueDate), isoToJalali(laterBefore.dueDate))
  assert.equal(getOccurrenceKey(laterAfter), getOccurrenceKey(laterBefore))
  assert.equal(parent.startDate, initial.parent.startDate)
  assert.equal(parent.endDate, initial.parent.endDate)
  assert.equal(parent.recurrence, initial.parent.recurrence)
})

test('restoring a deleted middle occurrence returns it to the same key and Jalali due date', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ endDate: '', loanDurationMonths: 6 }) })
  const target = initial.children[2]
  const targetKey = getOccurrenceKey(target)
  const deleted = deleteRecurringOccurrences({ records: initial.records, targetRecord: target, occurrenceKeys: [targetKey] })
  const restored = restoreRecurringOccurrence({ records: deleted, targetRecord: target })
  const list = deriveDebtListRecords(restored)
  const restoredOccurrence = list.find(item => getOccurrenceKey(item) === targetKey)

  assert.equal(restoredOccurrence.parentDebtId, initial.parent.id)
  assert.equal(restoredOccurrence.recurrenceId, initial.parent.recurrenceId)
  assert.equal(restoredOccurrence.occurrenceIndex, 2)
  assert.equal(isoToJalali(restoredOccurrence.dueDate), '1405/03/15')
  assert.equal(list.length, 6)
  assert.equal(list.filter(item => getOccurrenceKey(item) === targetKey).length, 1)
})

test('restoring a paid deleted occurrence preserves paid status and history', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ endDate: '', loanDurationMonths: 6 }) })
  const paid = { ...initial.children[2], status: 'پرداخت شده', paidAt: '2026-06-10T00:00:00.000Z', paidAmount: 1000, paidCount: 1 }
  const records = [initial.parent, ...initial.children.map(child => getOccurrenceKey(child) === getOccurrenceKey(paid) ? paid : child)]
  const deleted = deleteRecurringOccurrences({ records, targetRecord: paid, occurrenceKeys: [getOccurrenceKey(paid)] })
  const restored = restoreRecurringOccurrence({ records: deleted, targetRecord: paid })
  const restoredOccurrence = deriveDebtListRecords(restored).find(item => getOccurrenceKey(item) === getOccurrenceKey(paid))

  assert.equal(restoredOccurrence.status, 'پرداخت شده')
  assert.equal(restoredOccurrence.paidAmount, 1000)
  assert.equal(restoredOccurrence.paidCount, 1)
})

test('editing the series after deletion keeps restore metadata so the deleted date can come back', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt({ endDate: '', loanDurationMonths: 6 }) })
  const target = initial.children[2]
  const targetKey = getOccurrenceKey(target)
  const deleted = deleteRecurringOccurrences({ records: initial.records, targetRecord: target, occurrenceKeys: [targetKey] })
  const editedParent = { ...deleted.find(item => item.isRecurringParent), amount: 2000 }
  const edited = reconcileRecurringDebtOccurrences({
    parentDebt: editedParent,
    existingOccurrences: deleted.filter(item => item.isRecurringChild),
  })
  const restored = restoreRecurringOccurrence({ records: edited.records, targetRecord: target })

  assert.equal(deriveDebtListRecords(edited.records).some(item => getOccurrenceKey(item) === targetKey), false)
  assert.equal(deriveDebtListRecords(restored).some(item => getOccurrenceKey(item) === targetKey), true)
})

test('deleted middle occurrence is not regenerated after refresh or reconciliation', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const target = initial.children[5]
  const targetKey = getOccurrenceKey(target)
  const nextRecords = deleteRecurringOccurrences({ records: initial.records, targetRecord: target, occurrenceKeys: [targetKey] })
  const parent = nextRecords.find(item => item.isRecurringParent)
  const existingOccurrences = nextRecords.filter(item => item.isRecurringChild)
  const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: parent, existingOccurrences })
  const list = deriveDebtListRecords(reconciled.records)

  assert.equal(list.some(item => getOccurrenceKey(item) === targetKey), false)
  assert.equal(list.length, 11)
})

test('deleting selected child occurrences leaves unchecked occurrences visible', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const selected = [initial.children[1], initial.children[3]]
  const selectedKeys = selected.map(getOccurrenceKey)
  const untouchedKey = getOccurrenceKey(initial.children[2])
  const nextRecords = deleteRecurringOccurrences({
    records: initial.records,
    targetRecord: selected[0],
    occurrenceKeys: selectedKeys,
  })
  const list = deriveDebtListRecords(nextRecords)

  assert.equal(list.length, 10)
  assert.equal(selectedKeys.every(key => !list.some(item => getOccurrenceKey(item) === key)), true)
  assert.equal(list.some(item => getOccurrenceKey(item) === untouchedKey), true)
})

test('deleting all recurring occurrences deactivates parent and children', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const nextRecords = deleteRecurringOccurrences({
    records: initial.records,
    targetRecord: initial.children[0],
    occurrenceKeys: initial.children.map(getOccurrenceKey),
    deleteSeries: true,
  })
  const list = deriveDebtListRecords(nextRecords)

  assert.equal(nextRecords.every(item => item.archived && item.inactive), true)
  assert.equal(list.length, 0)
})

test('deleting a paid occurrence preserves paid history as archived', () => {
  const initial = reconcileRecurringDebtOccurrences({ parentDebt: recurringDebt() })
  const paid = { ...initial.children[4], status: 'پرداخت شده', paidAt: '2026-08-01T00:00:00.000Z', paidAmount: 1000 }
  const records = [initial.parent, ...initial.children.map(child => getOccurrenceKey(child) === getOccurrenceKey(paid) ? paid : child)]
  const nextRecords = deleteRecurringOccurrences({
    records,
    targetRecord: paid,
    occurrenceKeys: [getOccurrenceKey(paid)],
  })
  const archivedPaid = nextRecords.find(item => getOccurrenceKey(item) === getOccurrenceKey(paid))

  assert.equal(archivedPaid.status, 'پرداخت شده')
  assert.equal(archivedPaid.archived, true)
  assert.equal(archivedPaid.paidAmount, 1000)
  assert.equal(deriveDebtListRecords(nextRecords).some(item => getOccurrenceKey(item) === getOccurrenceKey(paid)), false)
})

test('recurring delete dialog renders occurrence due dates through Jalali date labels', () => {
  const source = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')

  assert.equal(source.includes('dateLabel(occurrence.dueDate)'), true)
  assert.equal(source.includes('topSelectionButtonLabel'), true)
  assert.equal(source.includes('deleteButtonLabel'), true)
  assert.equal(source.includes("selected ? 'selected'"), true)
})

test('recurring delete selection labels follow single, multiple, all, and none states', () => {
  assert.deepEqual(getRecurringDeleteSelectionState([], 6), {
    selectedCount: 0,
    totalCount: 6,
    isAllSelected: false,
    isNoneSelected: true,
    topSelectionButtonLabel: 'انتخاب همه',
    deleteButtonLabel: 'حذف موارد انتخاب‌شده',
  })
  assert.equal(getRecurringDeleteSelectionState(['a'], 6).topSelectionButtonLabel, 'انتخاب همه')
  assert.equal(getRecurringDeleteSelectionState(['a'], 6).deleteButtonLabel, 'حذف مورد انتخاب‌شده')
  assert.equal(getRecurringDeleteSelectionState(['a', 'b'], 6).deleteButtonLabel, 'حذف موارد انتخاب‌شده')
  assert.equal(getRecurringDeleteSelectionState(['a', 'b', 'c'], 3).topSelectionButtonLabel, 'لغو انتخاب')
  assert.equal(getRecurringDeleteSelectionState(['a', 'b', 'c'], 3).deleteButtonLabel, 'حذف همه')
})

test('recurring delete dialog keeps select-all action at top and delete/cancel at bottom', () => {
  const source = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')
  const summaryIndex = source.indexOf('recurring-delete-summary')
  const optionsIndex = source.indexOf('recurring-delete-options')
  const actionsIndex = source.indexOf('recurring-delete-actions')

  assert.ok(summaryIndex > -1 && optionsIndex > summaryIndex)
  assert.ok(actionsIndex > optionsIndex)
  assert.equal(source.includes('selection.isNoneSelected'), true)
})

test('recurring delete rows are sorted by due date before rendering', () => {
  const source = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')

  assert.equal(source.includes('.sort((a, b) => compareDates(a.dueDate, b.dueDate))'), true)
})

test('legacy debts without startDate safely fall back to dueDate', () => {
  const legacyDebt = recurringDebt({ startDate: '', endDate: '1405/05/30', dueDate: '1405/03/15' })
  const occurrences = generateDebtOccurrencesForParent(legacyDebt, { rangeEnd: '1405/05/30' })

  assert.equal(isoToJalali(getDebtScheduleAnchor(legacyDebt)), '1405/03/15')
  assert.deepEqual(toJalaliList(occurrences), ['1405/03/15', '1405/04/15', '1405/05/15'])
})

test('payment duration label does not end with ماهیانه', () => {
  const source = readFileSync(new URL('../../../components/records/RecordForm.jsx', import.meta.url), 'utf8')
  const label = source.match(/<label>(مدت زمان پرداخت دوره‌ای[^<]*)<\/label>/)?.[1]

  assert.equal(label, 'مدت زمان پرداخت دوره‌ای')
  assert.equal(label.endsWith('ماهیانه'), false)
})
