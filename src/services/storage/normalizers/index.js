export * from './baseNormalizer.js'
export { normalizeRecord } from './recordNormalizer.js'
export { normalizeLoan } from './loanNormalizer.js'
export { normalizeInstallment } from './installmentNormalizer.js'
export { normalizeCheck } from './checkNormalizer.js'
export { normalizeBank } from './bankNormalizer.js'
export { normalizeBankAccount } from './bankAccountNormalizer.js'
export { normalizeCategory } from './categoryNormalizer.js'
export { normalizeContact } from './contactNormalizer.js'
export { normalizeSettings } from './settingsNormalizer.js'
export { fromLegacyFinanceData as normalizeLegacyFinanceData } from '../adapters/legacyFinanceAdapter.js'

import { normalizeBank } from './bankNormalizer.js'
import { normalizeBankAccount } from './bankAccountNormalizer.js'
import { normalizeCategory } from './categoryNormalizer.js'
import { normalizeCheck } from './checkNormalizer.js'
import { normalizeContact } from './contactNormalizer.js'
import { normalizeInstallment } from './installmentNormalizer.js'
import { normalizeLoan } from './loanNormalizer.js'
import { normalizeRecord } from './recordNormalizer.js'
import { normalizeSettings } from './settingsNormalizer.js'

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

export function normalizeEntity(entityType, entity) {
  const normalizer = NORMALIZERS[entityType]
  return normalizer ? normalizer(entity) : normalizeRecord(entity)
}

export function normalizeCollection(entityType, collection) {
  return Array.isArray(collection)
    ? collection.map(entity => normalizeEntity(entityType, entity))
    : []
}
