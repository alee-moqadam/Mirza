import { dynamicStatus, inCurrentMonth, jalaliToIso, nextDueDate } from './dates'

export function filterAndSortRecords(items, filter, sort) {
  const sortValue = item => sort === 'contact' ? (item.contact || item.contacts?.[0] || '') : (item[sort] || '')
  return items
    .filter(item => {
      const status = dynamicStatus(item)
      if (filter === 'بحرانی') return item.isCheck && ['برگشت‌خورده', 'عقب‌افتاده', 'نزدیک سررسید'].includes(item.status === 'برگشت‌خورده' ? item.status : status)
      return filter === 'همه' || item.relation === filter || item.category === filter || status === filter || item.status === filter
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

export function prepareRecord(record) {
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
    startDate: jalaliToIso(record.startDate) || record.startDate,
    loanStartDate: jalaliToIso(record.loanStartDate) || record.loanStartDate,
    endDate: jalaliToIso(record.endDate) || record.endDate,
    dueDate: firstCheck?.dueDate || jalaliToIso(record.dueDate) || record.dueDate,
    expenseDate: jalaliToIso(record.expenseDate) || record.expenseDate,
    contacts,
    contact: contacts[0] || '',
    tags: record.tagsText ? record.tagsText.split(',').map(tag => tag.trim()).filter(Boolean) : (record.tags || []),
    source: record.incomeType ? record.category : record.source,
    checkAccountMode,
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
  return item
}

export function recordCompletionPatch(type, item) {
  if (type === 'debts') return { status: 'پرداخت شده', paidCount: Number(item.paidCount || 0) + 1 }
  if (type === 'incomes') return { status: 'دریافت شده', receivedAmount: item.amount }
  return { status: item.relation === 'پرداختنی' ? 'پرداخت شده' : 'دریافت شده' }
}

export function currentMonthPayables(items) {
  return items.filter(item => item.relation === 'پرداختنی' && inCurrentMonth(item.dueDate) && !['پرداخت شده', 'تسویه‌شده'].includes(item.status))
}
