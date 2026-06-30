import { compareDates, jalaliToIso } from './dates.js'

const DAY_MS = 86400000
const NON_RECURRING = new Set(['', 'فقط یک‌بار'])
const SETTLED_STATUSES = new Set(['پرداخت شده', 'دریافت شده', 'تسویه‌شده'])
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

const lastDayOfMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

export function addScheduleIntervals(value, recurrence, count = 1) {
  const date = utcDate(value)
  const interval = RECURRENCE_INTERVALS[recurrence]
  if (!date || !interval) return ''
  if (interval.days) {
    date.setUTCDate(date.getUTCDate() + interval.days * count)
    return isoFromUtcDate(date)
  }
  const targetMonth = date.getUTCMonth() + interval.months * count
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12)
  const monthIndex = ((targetMonth % 12) + 12) % 12
  const day = Math.min(date.getUTCDate(), lastDayOfMonth(targetYear, monthIndex))
  return isoFromUtcDate(new Date(Date.UTC(targetYear, monthIndex, day)))
}

export const addScheduleInterval = (value, recurrence) => addScheduleIntervals(value, recurrence, 1)

export function getDebtScheduleAnchor(debt = {}) {
  return normalizeScheduleDate(debt.startDate || debt.loanStartDate || debt.createdAt || debt.dueDate)
}

export function isRecurringDebt(debt = {}) {
  return !debt.isCheck && !debt.isGenerated && !NON_RECURRING.has(debt.recurrence || '') && Boolean(RECURRENCE_INTERVALS[debt.recurrence])
}

export function createOccurrenceKey(parentId, occurrenceDate) {
  return `${parentId}:${occurrenceDate}`
}

export function createGeneratedDebtOccurrence(parent, occurrenceDate, existingOverride = null) {
  const parentId = parent.parentDebtId || parent.id || parent.localId
  const recurrenceId = parent.recurrenceId || parentId
  const recurrenceKey = createOccurrenceKey(recurrenceId, occurrenceDate)
  const generated = {
    ...parent,
    id: `generated-${recurrenceKey}`,
    localId: `generated-${recurrenceKey}`,
    parentDebtId: parentId,
    recurrenceId,
    recurrenceKey,
    occurrenceDate,
    dueDate: occurrenceDate,
    isGenerated: true,
    status: parent.status && SETTLED_STATUSES.has(parent.status) ? 'فعال' : (parent.status || 'فعال'),
    paidCount: 0,
  }
  delete generated.local_id
  return existingOverride ? { ...generated, ...existingOverride, recurrenceKey, occurrenceDate, parentDebtId: parentId, recurrenceId, isGenerated: true } : generated
}

export function generateDebtOccurrencesForParent(parent, options = {}) {
  if (!isRecurringDebt(parent)) return []
  const anchor = getDebtScheduleAnchor(parent)
  if (!anchor) return []
  const parentId = parent.parentDebtId || parent.id || parent.localId
  if (!parentId) return []

  const rangeStart = normalizeScheduleDate(options.rangeStart)
  const defaultRangeEnd = addScheduleInterval(normalizeScheduleDate(new Date().toISOString()), 'سالانه')
  const rangeEnd = normalizeScheduleDate(options.rangeEnd || parent.endDate || defaultRangeEnd)
  const maxOccurrences = Math.max(1, Number(options.maxOccurrences || parent.totalCount || parent.loanDurationMonths || 36))
  const overrides = options.overrides || new Map()
  const occurrences = []
  let occurrenceDate = anchor
  let guard = 0

  while (occurrenceDate && guard < maxOccurrences) {
    guard += 1
    if (parent.endDate && compareDates(occurrenceDate, parent.endDate) > 0) break
    if (rangeEnd && compareDates(occurrenceDate, rangeEnd) > 0) break
    if (!rangeStart || compareDates(occurrenceDate, rangeStart) >= 0) {
      const recurrenceId = parent.recurrenceId || parentId
      const recurrenceKey = createOccurrenceKey(recurrenceId, occurrenceDate)
      occurrences.push(createGeneratedDebtOccurrence(parent, occurrenceDate, overrides.get(recurrenceKey)))
    }
    const nextDate = addScheduleIntervals(anchor, parent.recurrence, guard)
    if (!nextDate || nextDate === occurrenceDate) break
    occurrenceDate = nextDate
  }

  return occurrences
}

export function deriveDebtListRecords(debts = [], options = {}) {
  const overrides = new Map()
  const baseRecords = []

  for (const debt of debts || []) {
    if (debt?.isGenerated && debt.recurrenceKey) {
      overrides.set(debt.recurrenceKey, debt)
    } else {
      baseRecords.push(debt)
    }
  }

  return baseRecords.flatMap(debt => isRecurringDebt(debt)
    ? generateDebtOccurrencesForParent(debt, { ...options, overrides })
    : [debt])
}
