import { compareDates, currentJalaliMonthEndIso, dynamicStatus, inCurrentMonth, jalaliToIso, nextDueDate } from './dates.js'

const SETTLED_TIME_STATUSES = ['پرداخت شده', 'تسویه‌شده', 'دریافت شده', 'لغوشده']

export function normalizeRecordTags(record = {}) {
  const sources = [record.tags, record.tagIds, record.labels]
  const values = sources.flatMap(source => {
    if (Array.isArray(source)) return source
    if (typeof source === 'string') return source.split(',')
    return []
  })
  return [...new Set(values.map(tag => String(tag || '').trim()).filter(Boolean))]
}

export function normalizeRecordDate(value) {
  if (!value) return ''
  const text = String(value).trim()
  if (!text) return ''
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0]
  if (isoDate) return isoDate
  const jalali = jalaliToIso(text)
  if (jalali) return jalali
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10)
}

export function normalizeFinancialRecord(record = {}, collection = '') {
  const tags = normalizeRecordTags(record)
  const normalized = {
    ...record,
    id: record.id || record.localId || record.local_id || crypto.randomUUID(),
    localId: record.localId || record.local_id || record.id || '',
    amount: Number(record.amount || 0),
    tags,
    metadata: record.metadata || record.sync || record.meta || {},
    startDate: normalizeRecordDate(record.startDate || record.loanStartDate),
    dueDate: normalizeRecordDate(record.dueDate),
    expenseDate: normalizeRecordDate(record.expenseDate),
    loanStartDate: normalizeRecordDate(record.loanStartDate),
    endDate: normalizeRecordDate(record.endDate),
    legacyCollection: record.legacyCollection || collection || record.collection || '',
  }
  if (!normalized.localId) normalized.localId = normalized.id
  if (collection === 'incomes' || normalized.legacyCollection === 'incomes' || normalized.incomeType || Object.prototype.hasOwnProperty.call(record, 'receivedAmount')) {
    normalized.legacyCollection = normalized.legacyCollection || 'incomes'
    normalized.incomeType = normalized.incomeType || record.kind || 'فقط یک‌بار'
  }
  if (collection === 'debts' || normalized.legacyCollection === 'debts' || normalized.relation || normalized.direction === 'payable' || normalized.direction === 'receivable') {
    normalized.legacyCollection = normalized.legacyCollection || 'debts'
    if (!normalized.relation) normalized.relation = normalized.direction === 'receivable' ? 'دریافتنی' : 'پرداختنی'
    if (!normalized.direction) normalized.direction = normalized.relation === 'دریافتنی' ? 'receivable' : 'payable'
  }
  return normalized
}

export function filterAndSortRecords(items, filter, sort) {
  const sortValue = item => sort === 'contact' ? (item.contact || item.contacts?.[0] || '') : (item[sort] || '')
  return (items || [])
    .map(normalizeFinancialRecord)
    .filter(item => {
      const status = dynamicStatus(item)
      if (filter === 'بحرانی') return item.isCheck && ['برگشت‌خورده', 'عقب‌افتاده', 'نزدیک سررسید'].includes(item.status === 'برگشت‌خورده' ? item.status : status)
      return filter === 'همه' || item.relation === filter || item.direction === filter || item.category === filter || item.categoryId === filter || status === filter || item.status === filter || item.type === filter
    })
    .sort((a, b) => {
      const priority = item => item.status === 'برگشت‌خورده' ? 0 : dynamicStatus(item) === 'عقب‌افتاده' ? 1 : dynamicStatus(item) === 'نزدیک سررسید' ? 3 : 4
      if (priority(a) !== priority(b)) return priority(a) - priority(b)
      return sort === 'amount'
      ? Number(b.amount) - Number(a.amount)
      : sort === 'category'
        ? (a.category || '').localeCompare(b.category || '')
        : sortValue(a).localeCompare(sortValue(b))
    })
}

export function prepareRecord(record, collection = '') {
  const now = new Date().toISOString()
  const contacts = record.contacts || (record.contact ? [record.contact] : [])
  const checkAccountMode = record.checkAccountMode || (record.iban ? 'iban' : record.account ? 'account' : 'card')
  const checkItems = (record.checkItems?.length ? record.checkItems : [{ checkNumber: record.checkNumber, dueDate: record.dueDate }])
    .map(check => ({
      id: check.id || crypto.randomUUID(),
      checkNumber: String(check.checkNumber || '').trim(),
      dueDate: jalaliToIso(check.dueDate) || check.dueDate,
    }))
    .filter(check => check.checkNumber && check.dueDate)
  const firstCheck = checkItems[0]
  const item = {
    ...record,
    amount: Number(record.amount || 0),
    receivedAmount: Number(record.receivedAmount || 0),
    loanTotalAmount: record.loanTotalAmount === '' ? '' : Number(record.loanTotalAmount || 0),
    loanDurationMonths: record.loanDurationMonths === '' ? '' : Number(record.loanDurationMonths || 0),
    interestRate: record.interestRate === '' ? '' : Number(record.interestRate || 0),
    startDate: normalizeRecordDate(record.startDate || record.loanStartDate),
    loanStartDate: normalizeRecordDate(record.loanStartDate),
    endDate: normalizeRecordDate(record.endDate),
    dueDate: firstCheck?.dueDate || normalizeRecordDate(record.dueDate),
    expenseDate: normalizeRecordDate(record.expenseDate),
    contacts,
    contact: contacts[0] || '',
    tags: record.tagsText ? normalizeRecordTags({ tags: record.tagsText }) : normalizeRecordTags(record),
    source: record.incomeType ? record.category : record.source,
    checkAccountMode,
    metadata: record.metadata || record.sync || record.meta || {},
    updatedAt: now,
  }
  if (item.isCheck) {
    item.checkItems = checkItems
    item.checkNumber = firstCheck?.checkNumber || item.checkNumber
    item.account = checkAccountMode === 'account' ? item.account : ''
    item.iban = checkAccountMode === 'iban' ? item.iban : ''
    item.card = checkAccountMode === 'card' ? item.card : ''
    item.bank = item.issuerBank || item.bank || item.receiverBank || ''
  }
  if (!item.isCheck && (item.relation === 'پرداختنی' || Object.prototype.hasOwnProperty.call(record, 'receivedAmount'))) {
    item.isPeriodic = Boolean(item.isPeriodic)
    if (!item.isPeriodic) {
      item.recurrence = 'فقط یک‌بار'
      item.endless = false
      item.endDate = ''
    }
  }
  if (!item.id) {
    item.id = crypto.randomUUID()
    item.createdAt = now
  }
  return normalizeFinancialRecord(item, collection)
}

export function recordCompletionPatch(type, item) {
  if (type === 'debts') return { status: 'پرداخت شده', paidCount: Number(item.paidCount || 0) + 1 }
  if (type === 'incomes') return { status: 'دریافت شده', receivedAmount: item.amount }
  return { status: item.relation === 'پرداختنی' ? 'پرداخت شده' : 'دریافت شده' }
}

export function currentMonthPayables(items) {
  return items.filter(item => item.relation === 'پرداختنی' && inCurrentMonth(item.dueDate) && !['پرداخت شده', 'تسویه‌شده'].includes(item.status))
}

export const isActiveTimeRecord = item => !SETTLED_TIME_STATUSES.includes(item.status)

export function filterRecordsByTimeTab(items, tab) {
  const monthEnd = currentJalaliMonthEndIso()
  return (items || []).filter(source => {
    const item = normalizeFinancialRecord(source)
    if (!isActiveTimeRecord(item)) return false
    if (!item.dueDate) return tab === 'current'
    const isFuture = compareDates(item.dueDate, monthEnd) > 0
    return tab === 'future' ? isFuture : !isFuture
  })
}

export function recordDate(item) {
  const normalized = normalizeFinancialRecord(item)
  return normalized.expenseDate || normalized.dueDate || normalized.startDate || normalizeRecordDate(normalized.createdAt) || ''
}

export function applyRecordFilters(items, filters = {}, type = '') {
  return (items || []).filter(source => {
    const item = normalizeFinancialRecord(source, type)
    const amount = Number(item.amount || 0)
    const date = recordDate(item)
    const fromDate = normalizeRecordDate(filters.dateFrom)
    const toDate = normalizeRecordDate(filters.dateTo)
    const itemBanks = [item.bank, item.issuerBank, item.receiverBank].filter(Boolean)
    const tags = normalizeRecordTags(item)
    return (!filters.tagFilter || tags.includes(filters.tagFilter)) &&
      (!filters.category || item.category === filters.category || item.categoryId === filters.category || item.type === filters.category || item.incomeType === filters.category) &&
      (!filters.bank || itemBanks.includes(filters.bank)) &&
      (!(filters.tags || []).length || (filters.tags || []).every(tag => tags.includes(tag))) &&
      (!filters.amountFrom || amount >= Number(filters.amountFrom)) &&
      (!filters.amountTo || amount <= Number(filters.amountTo)) &&
      (!fromDate || !date || compareDates(date, fromDate) >= 0) &&
      (!toDate || !date || compareDates(date, toDate) <= 0)
  })
}
