import { normalizeBank } from '../normalizers/bankNormalizer.js'
import { normalizeCategory } from '../normalizers/categoryNormalizer.js'
import { normalizeContact } from '../normalizers/contactNormalizer.js'
import { normalizeRecord } from '../normalizers/recordNormalizer.js'

export const LEGACY_FINANCE_COLLECTIONS = [
  'debts',
  'incomes',
  'currentExpenses',
  'histories',
  'banks',
  'financialContacts',
  'expenseCategories',
  'incomeCategories',
  'financialGoals',
  'notifications',
]

const LEGACY_RECORD_COLLECTIONS = ['debts', 'incomes', 'currentExpenses', 'histories']
const LEGACY_CATEGORY_COLLECTIONS = ['expenseCategories', 'incomeCategories']

export function createEmptyLegacyFinanceData() {
  return LEGACY_FINANCE_COLLECTIONS.reduce((result, collection) => ({
    ...result,
    [collection]: [],
  }), {})
}

export function fromLegacyFinanceData(legacyData = {}) {
  return {
    records: LEGACY_RECORD_COLLECTIONS.flatMap(collection => normalizeLegacyCollection(
      legacyData,
      collection,
      normalizeRecord
    )),
    banks: normalizeLegacyCollection(legacyData, 'banks', normalizeBank),
    financial_contacts: normalizeLegacyCollection(legacyData, 'financialContacts', normalizeContact),
    categories: LEGACY_CATEGORY_COLLECTIONS.flatMap(collection => normalizeLegacyCollection(
      legacyData,
      collection,
      normalizeCategory
    )),
    financialGoals: Array.isArray(legacyData.financialGoals) ? legacyData.financialGoals : [],
    notifications: Array.isArray(legacyData.notifications) ? legacyData.notifications : [],
    legacyPayload: { ...legacyData },
  }
}

export function toLegacyFinanceData(domainData = {}) {
  const empty = createEmptyLegacyFinanceData()
  const legacyPayload = domainData.legacyPayload && typeof domainData.legacyPayload === 'object'
    ? domainData.legacyPayload
    : {}
  const records = Array.isArray(domainData.records) ? domainData.records : []
  const categories = Array.isArray(domainData.categories) ? domainData.categories : []

  return {
    ...legacyPayload,
    ...empty,
    debts: records.filter(record => getLegacyRecordCollection(record) === 'debts'),
    incomes: records.filter(record => getLegacyRecordCollection(record) === 'incomes'),
    currentExpenses: records.filter(record => getLegacyRecordCollection(record) === 'currentExpenses'),
    histories: records.filter(record => getLegacyRecordCollection(record) === 'histories'),
    banks: Array.isArray(domainData.banks) ? domainData.banks : [],
    financialContacts: Array.isArray(domainData.financial_contacts) ? domainData.financial_contacts : [],
    expenseCategories: categories.filter(category => getLegacyCategoryCollection(category) === 'expenseCategories'),
    incomeCategories: categories.filter(category => getLegacyCategoryCollection(category) === 'incomeCategories'),
    financialGoals: Array.isArray(domainData.financialGoals) ? domainData.financialGoals : [],
    notifications: Array.isArray(domainData.notifications) ? domainData.notifications : [],
  }
}

function normalizeLegacyCollection(legacyData, collection, normalizer) {
  return Array.isArray(legacyData?.[collection])
    ? legacyData[collection].map(entity => normalizer({ ...entity, legacyCollection: collection }))
    : []
}

function getLegacyRecordCollection(record = {}) {
  if (LEGACY_RECORD_COLLECTIONS.includes(record.legacyCollection)) return record.legacyCollection
  if (record.type === 'income') return 'incomes'
  if (record.type === 'expense') return 'currentExpenses'
  if (['receivable', 'payable', 'checkOperation'].includes(record.type)) return 'debts'
  return 'histories'
}

function getLegacyCategoryCollection(category = {}) {
  if (LEGACY_CATEGORY_COLLECTIONS.includes(category.legacyCollection)) return category.legacyCollection
  return category.type === 'income' ? 'incomeCategories' : 'expenseCategories'
}
