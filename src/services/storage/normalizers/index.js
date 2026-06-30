export * from './baseNormalizer'
export { normalizeRecord } from './recordNormalizer'
export { normalizeLoan } from './loanNormalizer'
export { normalizeInstallment } from './installmentNormalizer'
export { normalizeCheck } from './checkNormalizer'
export { normalizeBank } from './bankNormalizer'
export { normalizeBankAccount } from './bankAccountNormalizer'
export { normalizeCategory } from './categoryNormalizer'
export { normalizeContact } from './contactNormalizer'
export { normalizeSettings } from './settingsNormalizer'

import { normalizeBank } from './bankNormalizer'
import { normalizeBankAccount } from './bankAccountNormalizer'
import { normalizeCategory } from './categoryNormalizer'
import { normalizeCheck } from './checkNormalizer'
import { normalizeContact } from './contactNormalizer'
import { normalizeInstallment } from './installmentNormalizer'
import { normalizeLoan } from './loanNormalizer'
import { normalizeRecord } from './recordNormalizer'
import { normalizeSettings } from './settingsNormalizer'

const NORMALIZERS = {
  record: normalizeRecord,
  records: normalizeRecord,
  loan: normalizeLoan,
  loans: normalizeLoan,
  installment: normalizeInstallment,
  installments: normalizeInstallment,
  check: normalizeCheck,
  checks: normalizeCheck,
  bank: normalizeBank,
  banks: normalizeBank,
  bankAccount: normalizeBankAccount,
  bank_accounts: normalizeBankAccount,
  category: normalizeCategory,
  categories: normalizeCategory,
  contact: normalizeContact,
  financial_contact: normalizeContact,
  financial_contacts: normalizeContact,
  settings: normalizeSettings,
}

const LEGACY_COLLECTION_MAP = {
  debts: { target: 'records', normalizer: normalizeRecord },
  incomes: { target: 'records', normalizer: normalizeRecord },
  currentExpenses: { target: 'records', normalizer: normalizeRecord },
  histories: { target: 'records', normalizer: normalizeRecord },
  banks: { target: 'banks', normalizer: normalizeBank },
  financialContacts: { target: 'financial_contacts', normalizer: normalizeContact },
  expenseCategories: { target: 'categories', normalizer: normalizeCategory },
  incomeCategories: { target: 'categories', normalizer: normalizeCategory },
}

export function normalizeEntity(entityType, entity) {
  const normalizer = NORMALIZERS[entityType]
  return normalizer ? normalizer(entity) : normalizeRecord(entity)
}

export function normalizeCollection(entityType, collection) {
  return Array.isArray(collection)
    ? collection.map(entity => normalizeEntity(entityType, entity))
    : []
}

export function normalizeLegacyFinanceData(data = {}) {
  return Object.entries(LEGACY_COLLECTION_MAP).reduce((result, [legacyCollection, config]) => {
    const collection = Array.isArray(data?.[legacyCollection]) ? data[legacyCollection] : []
    const normalized = collection.map(entity => config.normalizer({
      ...entity,
      legacyCollection,
    }))

    return {
      ...result,
      [config.target]: [...(result[config.target] || []), ...normalized],
    }
  }, {
    records: [],
    banks: [],
    financial_contacts: [],
    categories: [],
  })
}
