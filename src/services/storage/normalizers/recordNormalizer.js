import { normalizeDate, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

const ALLOWED_RECORD_TYPES = [
  'income',
  'expense',
  'receivable',
  'payable',
  'loanPayment',
  'checkOperation',
  'transfer',
  'openingBalance',
  'adjustment',
]

export function normalizeRecord(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'record'),
    type: normalizeRecordType(entity.type || entity.recordType, inferRecordType(entity)),
    title: normalizeText(entity.title, ''),
    amount: normalizeNumber(entity.amount),
    date: normalizeDate(entity.date || entity.dueDate || entity.expenseDate || entity.startDate, null),
    direction: normalizeText(entity.direction, inferDirection(entity)),
    status: normalizeText(entity.status, ''),
    categoryId: entity.categoryId || entity.category_id || null,
    bankAccountId: entity.bankAccountId || entity.bank_account_id || null,
    contactId: entity.contactId || entity.contact_id || entity.contact || null,
    loanId: entity.loanId || entity.loan_id || null,
    installmentId: entity.installmentId || entity.installment_id || null,
    checkId: entity.checkId || entity.check_id || null,
    transferGroupId: entity.transferGroupId || entity.transfer_group_id || null,
    notes: normalizeText(entity.notes || entity.description, ''),
  }
}

function inferRecordType(entity) {
  if (isCheckRelated(entity)) return 'checkOperation'
  if (entity.legacyCollection === 'incomes' || entity.incomeType) return 'income'
  if (entity.legacyCollection === 'currentExpenses' || entity.expenseDate) return 'expense'
  if (entity.legacyCollection === 'debts' && entity.relation === 'دریافتنی') return 'receivable'
  if (entity.legacyCollection === 'debts' && entity.relation === 'پرداختنی') return 'payable'
  if (entity.legacyCollection === 'histories') return 'adjustment'
  return 'adjustment'
}

function normalizeRecordType(value, fallback = 'adjustment') {
  const type = normalizeText(value, fallback)
  return ALLOWED_RECORD_TYPES.includes(type) ? type : fallback
}

function isCheckRelated(entity) {
  return Boolean(entity.isCheck || entity.checkId || entity.check_id || entity.checkNumber || entity.check_number)
}

function inferDirection(entity) {
  if (entity.direction) return entity.direction
  if (entity.legacyCollection === 'incomes' || entity.relation === 'دریافتنی') return 'inflow'
  if (entity.legacyCollection === 'currentExpenses' || entity.relation === 'پرداختنی') return 'outflow'
  return ''
}
