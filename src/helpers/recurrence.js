import jalaali from 'jalaali-js'
import { compareDates, isoToJalali, jalaliToIso } from './dates.js'

const NON_RECURRING = new Set(['', 'فقط یک‌بار'])
const SETTLED_STATUSES = new Set(['پرداخت شده', 'دریافت شده', 'تسویه‌شده'])
const PAID_STATUSES = new Set(['پرداخت شده', 'دریافت شده', 'تسویه‌شده'])
const RECURRENCE_INTERVALS = {
  روزانه: { days: 1 },
  هفتگی: { days: 7 },
  ماهانه: { months: 1 },
  ماهیانه: { months: 1 },
  دوماهه: { months: 2 },
  سه‌ماهه: { months: 3 },
  'شش‌ماهه': { months: 6 },
  سالانه: { months: 12 },
  سالیانه: { months: 12 },
}

const { isValidJalaaliDate, toGregorian } = jalaali
const pad = value => String(value).padStart(2, '0')

export function normalizeScheduleDate(value) {
  if (!value) return ''
  const text = String(value).trim()
  if (!text) return ''
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0]
  if (iso) return iso
  const jalali = jalaliToIso(text)
  if (jalali) return jalali
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const utcDate = value => {
  const iso = normalizeScheduleDate(value)
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const isoFromUtcDate = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`

const lastDayOfJalaliMonth = (year, month) => {
  let day = 31
  while (!isValidJalaaliDate(year, month, day)) day -= 1
  return day
}

export function getPaymentPeriodInterval(paymentPeriod) {
  return RECURRENCE_INTERVALS[paymentPeriod] || null
}

export function addJalaliPeriod(value, paymentPeriod, occurrenceIndex = 1) {
  const date = utcDate(value)
  const interval = getPaymentPeriodInterval(paymentPeriod)
  const count = Math.max(0, Number(occurrenceIndex || 0))
  if (!date || !interval) return ''
  if (count === 0) return isoFromUtcDate(date)
  if (interval.days) {
    date.setUTCDate(date.getUTCDate() + interval.days * count)
    return isoFromUtcDate(date)
  }
  const jalali = isoToJalali(isoFromUtcDate(date))
  const [year, month, day] = jalali.split('/').map(Number)
  const monthOffset = interval.months * count
  const zeroBasedTarget = (month - 1) + monthOffset
  const targetYear = year + Math.floor(zeroBasedTarget / 12)
  const targetMonth = ((zeroBasedTarget % 12) + 12) % 12 + 1
  const targetDay = Math.min(day, lastDayOfJalaliMonth(targetYear, targetMonth))
  const { gy, gm, gd } = toGregorian(targetYear, targetMonth, targetDay)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export function addScheduleIntervals(value, recurrence, count = 1) {
  const date = utcDate(value)
  const interval = getPaymentPeriodInterval(recurrence)
  if (!date || !interval) return ''
  if (interval.days) {
    date.setUTCDate(date.getUTCDate() + interval.days * count)
    return isoFromUtcDate(date)
  }
  return addJalaliPeriod(value, recurrence, count)
}

export const addScheduleInterval = (value, recurrence) => addScheduleIntervals(value, recurrence, 1)

export function getDebtScheduleAnchor(debt = {}) {
  return normalizeScheduleDate(debt.startDate || debt.loanStartDate || debt.createdAt || debt.dueDate)
}

export function calculateOccurrenceDueDate(baseDueDate, occurrenceIndex, paymentPeriod) {
  const normalizedDueDate = normalizeScheduleDate(baseDueDate)
  const index = Math.max(0, Number(occurrenceIndex || 0))
  if (!normalizedDueDate) return ''
  return addJalaliPeriod(normalizedDueDate, paymentPeriod, index)
}

export function isRecurringDebt(debt = {}) {
  return !debt.archived && !debt.inactive && debt.status !== 'لغوشده' && !debt.isCheck && !debt.isGenerated && !NON_RECURRING.has(debt.recurrence || '') && Boolean(getPaymentPeriodInterval(debt.recurrence))
}

export function isRecurringParent(debt = {}) {
  return Boolean(debt.isRecurringParent || (isRecurringDebt(debt) && !debt.isRecurringChild))
}

export function isRecurringChild(debt = {}) {
  return Boolean(debt.isRecurringChild || debt.isGenerated || debt.parentDebtId)
}

export function createRecurringDebtParent(debt = {}) {
  const id = debt.parentDebtId || debt.id || debt.localId || crypto.randomUUID()
  const recurrenceId = debt.recurrenceId || id
  const excludedOccurrenceKeys = [...new Set([
    ...(debt.excludedOccurrenceKeys || []),
    ...(debt.deletedOccurrenceKeys || []),
    ...(debt.metadata?.excludedOccurrenceKeys || []),
  ])]
  return {
    ...debt,
    id,
    localId: debt.localId || id,
    recordType: 'debt',
    isRecurringParent: true,
    isRecurringChild: false,
    isGenerated: false,
    parentDebtId: '',
    recurrenceId,
    excludedOccurrenceKeys,
  }
}

export function createOccurrenceKey(parentId, occurrenceIndex, dueDate) {
  return `${parentId}:${occurrenceIndex}:${dueDate}`
}

export function getOccurrenceKey(record = {}) {
  if (record.recurrenceKey) return record.recurrenceKey
  const recurrenceId = record.recurrenceId || record.parentDebtId
  if (!recurrenceId || !Number.isFinite(Number(record.occurrenceIndex)) || !record.dueDate) return ''
  return createOccurrenceKey(recurrenceId, Number(record.occurrenceIndex), normalizeScheduleDate(record.dueDate))
}

export const getExcludedOccurrenceKeys = parent => new Set([
  ...(parent?.excludedOccurrenceKeys || []),
  ...(parent?.deletedOccurrenceKeys || []),
  ...(parent?.metadata?.excludedOccurrenceKeys || []),
])

export function shouldGenerateOccurrence(parent, occurrenceKey, existingOverride = null) {
  if (existingOverride) return true
  return !getExcludedOccurrenceKeys(parent).has(occurrenceKey)
}

export function createGeneratedDebtOccurrence(parent, occurrenceDate, dueDate, occurrenceIndex, existingOverride = null) {
  const parentId = parent.parentDebtId || parent.id || parent.localId
  const recurrenceId = parent.recurrenceId || parentId
  const recurrenceKey = createOccurrenceKey(recurrenceId, occurrenceIndex, dueDate)
  const generated = {
    ...parent,
    id: `generated-${recurrenceKey}`,
    localId: `generated-${recurrenceKey}`,
    recordType: 'debt',
    isRecurringParent: false,
    isRecurringChild: true,
    parentDebtId: parentId,
    recurrenceId,
    recurrenceKey,
    occurrenceIndex,
    occurrenceDate,
    dueDate,
    isGenerated: true,
    status: parent.status && SETTLED_STATUSES.has(parent.status) ? 'فعال' : (parent.status || 'فعال'),
    paidCount: 0,
  }
  delete generated.local_id
  if (!existingOverride) return generated
  const preserved = {
    status: existingOverride.status,
    paidAt: existingOverride.paidAt,
    paidAmount: existingOverride.paidAmount,
    paidCount: existingOverride.paidCount,
    paymentHistory: existingOverride.paymentHistory,
    note: existingOverride.note,
    notes: existingOverride.notes,
    deletedAt: existingOverride.deletedAt,
    archived: existingOverride.archived,
    inactive: existingOverride.inactive,
  }
  Object.keys(preserved).forEach(key => preserved[key] === undefined && delete preserved[key])
  return { ...generated, ...preserved, recurrenceKey, occurrenceIndex, occurrenceDate, parentDebtId: parentId, recurrenceId, isGenerated: true, isRecurringChild: true }
}

export function generateDebtOccurrencesForParent(parent, options = {}) {
  if (!isRecurringDebt(parent)) return []
  const anchor = getDebtScheduleAnchor(parent)
  if (!anchor) return []
  const baseDueDate = normalizeScheduleDate(parent.dueDate || anchor)
  if (!baseDueDate) return []
  const parentId = parent.parentDebtId || parent.id || parent.localId
  if (!parentId) return []

  const rangeStart = normalizeScheduleDate(options.rangeStart)
  const defaultRangeEnd = addScheduleInterval(normalizeScheduleDate(new Date().toISOString()), 'سالانه')
  const scheduleEnd = normalizeScheduleDate(parent.endDate)
  const rangeEnd = normalizeScheduleDate(options.rangeEnd || scheduleEnd || defaultRangeEnd)
  const hasScheduleEnd = Boolean(scheduleEnd)
  const maxOccurrences = hasScheduleEnd
    ? Math.max(1, Number(options.maxOccurrences || 240))
    : Math.max(1, Number(options.maxOccurrences || parent.installmentCount || parent.totalCount || parent.loanDurationMonths || 36))
  const overrides = options.overrides || new Map()
  const occurrences = []
  let occurrenceDate = anchor
  let occurrenceIndex = 0

  while (occurrenceDate && occurrenceIndex < maxOccurrences) {
    const dueDate = calculateOccurrenceDueDate(baseDueDate, occurrenceIndex, parent.recurrence)
    if (!dueDate) break
    if (scheduleEnd && compareDates(occurrenceDate, scheduleEnd) > 0) break
    if (rangeEnd && compareDates(occurrenceDate, rangeEnd) > 0) break
    if (!rangeStart || compareDates(occurrenceDate, rangeStart) >= 0) {
      const recurrenceId = parent.recurrenceId || parentId
      const recurrenceKey = createOccurrenceKey(recurrenceId, occurrenceIndex, dueDate)
      const legacyKey = `${recurrenceId}:${occurrenceDate}`
      const existingOverride = overrides.get(recurrenceKey) || overrides.get(legacyKey) || overrides.get(`${recurrenceId}:${occurrenceIndex}`)
      if (shouldGenerateOccurrence(parent, recurrenceKey, existingOverride)) {
        occurrences.push(createGeneratedDebtOccurrence(
          parent,
          occurrenceDate,
          dueDate,
          occurrenceIndex,
          existingOverride
        ))
      }
    }
    occurrenceIndex += 1
    const nextDate = addJalaliPeriod(anchor, parent.recurrence, occurrenceIndex)
    if (!nextDate || nextDate === occurrenceDate) break
    occurrenceDate = nextDate
  }

  return occurrences
}

export function generateRecurringDebtOccurrences({
  parentDebt,
  existingOccurrences = [],
  options = {},
} = {}) {
  const overrides = new Map()
  for (const occurrence of existingOccurrences || []) {
    if (occurrence?.recurrenceKey) overrides.set(occurrence.recurrenceKey, occurrence)
    if (Number.isFinite(Number(occurrence?.occurrenceIndex))) overrides.set(`${occurrence.recurrenceId || occurrence.parentDebtId}:${Number(occurrence.occurrenceIndex)}`, occurrence)
  }
  return generateDebtOccurrencesForParent(createRecurringDebtParent(parentDebt), { ...options, overrides })
}

export function reconcileRecurringDebtOccurrences({
  parentDebt,
  existingOccurrences = [],
  options = {},
} = {}) {
  const parent = createRecurringDebtParent(parentDebt)
  const expectedChildren = generateRecurringDebtOccurrences({ parentDebt: parent, existingOccurrences, options })
  const expectedKeys = new Set(expectedChildren.map(child => child.recurrenceKey))
  const staleChildren = (existingOccurrences || []).filter(child => child?.recurrenceKey && !expectedKeys.has(child.recurrenceKey))
  const preservedHistorical = staleChildren
    .filter(child => PAID_STATUSES.has(child.status))
    .map(child => ({ ...child, archived: true, inactive: true, updatedAt: new Date().toISOString() }))

  return {
    parent,
    children: expectedChildren,
    staleChildren,
    records: [parent, ...expectedChildren, ...preservedHistorical],
  }
}

export function getRecurringGroupForRecord(record = {}, debts = []) {
  const recurrenceId = record.recurrenceId || record.parentDebtId || record.id
  const parent = (debts || []).find(debt => debt.recurrenceId === recurrenceId && isRecurringParent(debt))
    || (debts || []).find(debt => debt.id === record.parentDebtId)
    || (isRecurringParent(record) ? record : null)
  const children = (debts || []).filter(debt => (debt.recurrenceId === recurrenceId || debt.parentDebtId === parent?.id) && isRecurringChild(debt))
  return { recurrenceId, parent, children }
}

export function markOccurrencesDeletedOrInactive(occurrences = [], occurrenceKeys = []) {
  const now = new Date().toISOString()
  const selected = new Set(occurrenceKeys)
  return occurrences.map(occurrence => {
    const key = getOccurrenceKey(occurrence)
    if (!selected.has(key)) return occurrence
    const paid = PAID_STATUSES.has(occurrence.status)
    return {
      ...occurrence,
      recurrenceKey: key,
      isDeleted: true,
      isActive: false,
      inactive: true,
      archived: true,
      deletedAt: now,
      deletedReason: 'user_deleted_occurrence',
      status: paid ? occurrence.status : 'لغوشده',
      updatedAt: now,
    }
  })
}

export function deleteRecurringOccurrences({ records = [], targetRecord = {}, occurrenceKeys = [], deleteSeries = false } = {}) {
  const { recurrenceId, parent, children } = getRecurringGroupForRecord(targetRecord, records)
  if (!parent) return records.filter(record => record.id !== targetRecord.id)
  const now = new Date().toISOString()
  const inSeries = record => record.recurrenceId === recurrenceId || record.id === parent.id || record.parentDebtId === parent.id

  if (deleteSeries) {
    return records.map(record => {
      if (!inSeries(record)) return record
      const paid = PAID_STATUSES.has(record.status)
      return {
        ...record,
        isDeleted: true,
        isActive: false,
        inactive: true,
        archived: true,
        deletedAt: now,
        deletedReason: 'user_deleted_series',
        status: paid ? record.status : 'لغوشده',
        updatedAt: now,
      }
    })
  }

  const keys = [...new Set(occurrenceKeys.filter(Boolean))]
  if (!keys.length) return records
  const currentChildren = generateRecurringDebtOccurrences({ parentDebt: parent, existingOccurrences: children, options: { maxOccurrences: 240 } })
  const selectedChildren = currentChildren.filter(child => keys.includes(getOccurrenceKey(child)))
  const deletedChildren = markOccurrencesDeletedOrInactive(selectedChildren, keys)
  const nextParent = createRecurringDebtParent({
    ...parent,
    excludedOccurrenceKeys: [...new Set([...(parent.excludedOccurrenceKeys || []), ...keys])],
    deletedOccurrenceKeys: [...new Set([...(parent.deletedOccurrenceKeys || []), ...keys])],
    updatedAt: now,
  })
  const deletedKeySet = new Set(keys)
  const otherRecords = records.filter(record => !inSeries(record))
  const remainingSeriesRecords = records.filter(record => inSeries(record) && record.id !== parent.id && !deletedKeySet.has(getOccurrenceKey(record)))
  return [nextParent, ...remainingSeriesRecords, ...deletedChildren, ...otherRecords]
}

export function restoreRecurringOccurrence({ records = [], targetRecord = {}, occurrenceKey = '' } = {}) {
  const key = occurrenceKey || getOccurrenceKey(targetRecord)
  if (!key) return records
  const { recurrenceId, parent, children } = getRecurringGroupForRecord(targetRecord, records)
  if (!parent) return records
  const now = new Date().toISOString()
  const cleanKeys = keys => (keys || []).filter(item => item !== key)
  const nextParent = createRecurringDebtParent({
    ...parent,
    excludedOccurrenceKeys: cleanKeys(parent.excludedOccurrenceKeys),
    deletedOccurrenceKeys: cleanKeys(parent.deletedOccurrenceKeys),
    restoredOccurrenceKeys: [...new Set([...(parent.restoredOccurrenceKeys || []), key])],
    metadata: {
      ...(parent.metadata || {}),
      excludedOccurrenceKeys: cleanKeys(parent.metadata?.excludedOccurrenceKeys),
    },
    updatedAt: now,
  })
  const existing = (children || []).find(child => getOccurrenceKey(child) === key) || targetRecord
  const generated = generateRecurringDebtOccurrences({
    parentDebt: nextParent,
    existingOccurrences: (children || []).filter(child => getOccurrenceKey(child) !== key),
    options: { maxOccurrences: 240 },
  }).find(child => getOccurrenceKey(child) === key)
  const restored = {
    ...(generated || existing),
    recurrenceKey: key,
    isDeleted: false,
    isActive: true,
    inactive: false,
    archived: false,
    deletedAt: '',
    deletedReason: '',
    restoredAt: now,
    status: PAID_STATUSES.has(existing.status) ? existing.status : 'فعال',
    paidAt: existing.paidAt,
    paidAmount: existing.paidAmount,
    paidCount: existing.paidCount,
    paymentHistory: existing.paymentHistory,
    updatedAt: now,
  }
  Object.keys(restored).forEach(field => restored[field] === undefined && delete restored[field])
  const inSeries = record => record.recurrenceId === recurrenceId || record.id === parent.id || record.parentDebtId === parent.id
  return [
    nextParent,
    ...records.filter(record => inSeries(record) && record.id !== parent.id && getOccurrenceKey(record) !== key),
    restored,
    ...records.filter(record => !inSeries(record)),
  ]
}

export function getRecurringDeleteSelectionState(selectedKeys = [], totalCount = 0) {
  const selectedCount = selectedKeys.length
  const isAllSelected = totalCount > 0 && selectedCount === totalCount
  const isNoneSelected = selectedCount === 0
  return {
    selectedCount,
    totalCount,
    isAllSelected,
    isNoneSelected,
    topSelectionButtonLabel: isAllSelected ? 'لغو انتخاب' : 'انتخاب همه',
    deleteButtonLabel: isAllSelected
      ? 'حذف همه'
      : selectedCount === 1
        ? 'حذف مورد انتخاب‌شده'
        : 'حذف موارد انتخاب‌شده',
  }
}

export function deriveDebtListRecords(debts = [], options = {}) {
  const overrides = new Map()
  const baseRecords = []
  const recurringParents = []

  for (const debt of debts || []) {
    if (debt?.isGenerated && debt.recurrenceKey) {
      overrides.set(debt.recurrenceKey, debt)
      if (Number.isFinite(Number(debt.occurrenceIndex))) overrides.set(`${debt.recurrenceId || debt.parentDebtId}:${Number(debt.occurrenceIndex)}`, debt)
    } else if (isRecurringParent(debt)) {
      recurringParents.push(debt)
    } else {
      baseRecords.push(debt)
    }
  }

  return [...baseRecords, ...recurringParents.flatMap(debt => isRecurringDebt(debt)
    ? generateDebtOccurrencesForParent(debt, { ...options, overrides })
    : [debt])]
    .filter(debt => !debt.archived && !debt.inactive)
}
