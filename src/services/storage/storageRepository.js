import { runSafeMigration } from './migrationService'
import * as localStorageDriver from './storageDrivers/localStorageDriver'

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  DELETED: 'deleted',
}

const RECORD_COLLECTIONS = [
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

// Driver layer allows a future switch from localStorage to SQLite without
// changing the repository API. SQLite is not active yet; migration will be
// implemented in a later step.
const ACTIVE_STORAGE_DRIVER = 'localStorage'
const activeDriver = localStorageDriver

const nowIso = () => new Date().toISOString()
const createFallbackLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const createLocalId = item => item.localId || item.id || (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : createFallbackLocalId()
)

export function normalizeStorageRecord(item = {}) {
  const createdAt = item.createdAt || item.updatedAt || nowIso()
  const updatedAt = item.updatedAt || createdAt

  return {
    ...item,
    localId: createLocalId(item),
    serverId: item.serverId || null,
    createdAt,
    updatedAt,
    deletedAt: item.deletedAt || null,
    syncStatus: item.syncStatus || SYNC_STATUS.PENDING,
    lastSyncedAt: item.lastSyncedAt || null,
    version: Number(item.version || 1),
  }
}

export function normalizeStorageData(data = {}) {
  return RECORD_COLLECTIONS.reduce((result, collection) => ({
    ...result,
    [collection]: Array.isArray(result[collection])
      ? result[collection].map(normalizeStorageRecord)
      : result[collection],
  }), { ...data })
}

export function loadFinanceData() {
  runSafeMigration()
  return normalizeStorageData(activeDriver.readFinanceData())
}

export function saveFinanceData(data) {
  const normalized = normalizeStorageData(data)
  activeDriver.writeFinanceData(normalized)
  return normalized
}

export function updateFinanceData(updater) {
  const current = loadFinanceData()
  const next = typeof updater === 'function' ? updater(current) : updater
  return saveFinanceData(next)
}

export function resetFinanceData() {
  return normalizeStorageData(activeDriver.restoreSampleData())
}

export function getRecords(collection) {
  const data = loadFinanceData()
  return Array.isArray(data[collection]) ? data[collection] : []
}

export function saveRecord(collection, record) {
  return updateFinanceData(current => ({
    ...current,
    [collection]: [normalizeStorageRecord(record), ...getCollectionWithoutRecord(current, collection, record)],
  }))
}

export function updateRecord(collection, recordId, patch) {
  return updateFinanceData(current => ({
    ...current,
    [collection]: (current[collection] || []).map(record => {
      if (record.id !== recordId && record.localId !== recordId) return record
      const nextPatch = typeof patch === 'function' ? patch(record) : patch
      return normalizeStorageRecord({ ...record, ...nextPatch, updatedAt: nowIso() })
    }),
  }))
}

export function deleteRecord(collection, recordId, { softDelete = false } = {}) {
  return updateFinanceData(current => ({
    ...current,
    [collection]: softDelete
      ? (current[collection] || []).map(record => (
        record.id === recordId || record.localId === recordId
          ? normalizeStorageRecord({ ...record, deletedAt: nowIso(), syncStatus: SYNC_STATUS.DELETED })
          : record
      ))
      : (current[collection] || []).filter(record => record.id !== recordId && record.localId !== recordId),
  }))
}

export function getSettings() {
  const data = loadFinanceData()
  return {
    notificationSettings: data.notificationSettings,
    lockSettings: data.lockSettings,
    banks: data.banks || [],
    financialContacts: data.financialContacts || [],
    expenseCategories: data.expenseCategories || [],
    incomeCategories: data.incomeCategories || [],
  }
}

export function saveSettings(settings) {
  return updateFinanceData(current => ({ ...current, ...settings }))
}

export const readFinanceData = loadFinanceData
export const writeFinanceData = saveFinanceData
export const restoreSampleData = resetFinanceData

function getCollectionWithoutRecord(data, collection, record) {
  return (data[collection] || []).filter(item => item.id !== record.id && item.localId !== record.localId)
}
