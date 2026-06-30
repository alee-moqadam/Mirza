import {
  getEntities,
  initializeLocalDatabase,
  insertEntity,
  LOCAL_DATABASE_TABLES,
} from '../localDatabaseService'
import { normalizeLegacyFinanceData } from '../normalizers'

const notReadyResponse = {
  ready: false,
  driver: 'sqlite',
  active: false,
  reason: 'sqlite-driver-not-active',
}

// Future SQLite driver boundary. It is intentionally inactive until a safe
// migration from localStorage is implemented and storageRepository is switched.
export async function getDriverStatus() {
  return initializeLocalDatabase()
}

export async function readFinanceData() {
  try {
    const status = await initializeLocalDatabase()
    if (!status.ready) return createEmptyFinanceDataShape()

    const [records, banks, contacts, categories] = await Promise.all([
      getEntities(LOCAL_DATABASE_TABLES.RECORDS),
      getEntities(LOCAL_DATABASE_TABLES.BANKS),
      getEntities(LOCAL_DATABASE_TABLES.FINANCIAL_CONTACTS),
      getEntities(LOCAL_DATABASE_TABLES.CATEGORIES),
    ])

    return mapDomainDataToLegacyShape({
      records: records.entities || [],
      banks: banks.entities || [],
      financial_contacts: contacts.entities || [],
      categories: categories.entities || [],
    })
  } catch {
    return createEmptyFinanceDataShape()
  }
}

export async function writeFinanceData(data) {
  try {
    const status = await initializeLocalDatabase()
    if (!status.ready) {
      return {
        ...notReadyResponse,
        driver: status.driver || notReadyResponse.driver,
        saved: false,
      }
    }

    const normalizedData = normalizeLegacyFinanceData(data)
    const entities = getWritableEntities(normalizedData)
    const results = []

    for (const { tableName, entity } of entities) {
      results.push(await insertEntity(tableName, entity))
    }

    const failed = results.filter(result => !result.success)

    return {
      ready: true,
      driver: 'sqlite',
      active: false,
      saved: failed.length === 0,
      written: results.length - failed.length,
      failed: failed.length,
    }
  } catch (error) {
    return {
      ...notReadyResponse,
      saved: false,
      error,
    }
  }
}

export function restoreSampleData() {
  return {
    ...notReadyResponse,
    restored: false,
  }
}

export async function readTable(tableName, options) {
  return getEntities(tableName, options)
}

export async function writeTableEntity(tableName, entity) {
  return insertEntity(tableName, entity)
}

export { LOCAL_DATABASE_TABLES }

export function createEmptyFinanceDataShape() {
  return {
    debts: [],
    incomes: [],
    currentExpenses: [],
    histories: [],
    banks: [],
    financialContacts: [],
    expenseCategories: [],
    incomeCategories: [],
    financialGoals: [],
    notifications: [],
  }
}

export function mapDomainDataToLegacyShape(domainData = {}) {
  const empty = createEmptyFinanceDataShape()
  const categories = Array.isArray(domainData.categories) ? domainData.categories : []

  return {
    ...empty,
    histories: Array.isArray(domainData.records) ? domainData.records : [],
    banks: Array.isArray(domainData.banks) ? domainData.banks : [],
    financialContacts: Array.isArray(domainData.financial_contacts) ? domainData.financial_contacts : [],
    expenseCategories: categories.filter(category => category.type === 'expense' || !category.type),
    incomeCategories: categories.filter(category => category.type === 'income'),
  }
}

function getWritableEntities(normalizedData = {}) {
  return [
    ...toTableEntities(LOCAL_DATABASE_TABLES.RECORDS, normalizedData.records),
    ...toTableEntities(LOCAL_DATABASE_TABLES.BANKS, normalizedData.banks),
    ...toTableEntities(LOCAL_DATABASE_TABLES.FINANCIAL_CONTACTS, normalizedData.financial_contacts),
    ...toTableEntities(LOCAL_DATABASE_TABLES.CATEGORIES, normalizedData.categories),
  ]
}

function toTableEntities(tableName, collection) {
  return Array.isArray(collection)
    ? collection.map(entity => ({ tableName, entity }))
    : []
}
