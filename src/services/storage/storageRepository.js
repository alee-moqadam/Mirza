import * as localStorageDriver from './storageDrivers/localStorageDriver.js'

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  DELETED: 'deleted',
}

const DOMAIN_COLLECTIONS = [
  'records',
  'loans',
  'installments',
  'checks',
  'banks',
  'bank_accounts',
  'categories',
  'financial_contacts',
  'settings',
  'sync_queue',
]

// Driver layer allows a future switch from localStorage to SQLite without
// changing the repository API. SQLite is not active yet; migration will be
// implemented in a later step.
const ACTIVE_STORAGE_DRIVER = 'localStorage'
const STORAGE_DRIVERS = {
  localStorage: {
    name: 'localStorage',
    driver: localStorageDriver,
    supportsSync: true,
    supportsAsync: false,
  },
}
let activeStorageDriverName = ACTIVE_STORAGE_DRIVER

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

export function normalizeDomainData(data = {}) {
  return DOMAIN_COLLECTIONS.reduce((result, collection) => {
    if (!Object.prototype.hasOwnProperty.call(result, collection)) return result
    return {
      ...result,
      [collection]: Array.isArray(result[collection])
        ? result[collection].map(normalizeStorageRecord)
        : result[collection],
    }
  }, data && typeof data === 'object' ? { ...data } : {})
}

export function readDomainData() {
  const driver = getActiveDriver()
  return normalizeDomainData(executeRead(driver))
}

export function writeDomainData(data) {
  const driver = getActiveDriver()
  const normalized = normalizeDomainData(data)
  executeWrite(normalized, driver)
  return normalized
}

export function updateDomainData(updater) {
  const current = readDomainData()
  const next = typeof updater === 'function' ? updater(current) : updater
  return writeDomainData(next)
}

export function readFinanceData() {
  const driver = getActiveDriver()
  return executeRead(driver, 'readFinanceData')
}

export function writeFinanceData(data) {
  const driver = getActiveDriver()
  executeWrite(data, driver, 'writeFinanceData')
  return data
}

export function restoreSampleData() {
  const driver = getActiveDriver()
  return executeRead(driver, 'restoreSampleData')
}

export function getRecords(collection) {
  const data = readDomainData()
  return Array.isArray(data[collection]) ? data[collection] : []
}

export function saveRecord(collection, record) {
  return updateDomainData(current => {
    const normalized = normalizeStorageRecord(record)
    return {
      ...current,
      [collection]: [normalized, ...getCollectionWithoutRecord(current, collection, normalized)],
    }
  })
}

export function updateRecord(collection, recordId, patch) {
  return updateDomainData(current => ({
    ...current,
    [collection]: (current[collection] || []).map(record => {
      if (record.id !== recordId && record.localId !== recordId) return record
      const nextPatch = typeof patch === 'function' ? patch(record) : patch
      return normalizeStorageRecord({
        ...record,
        ...nextPatch,
        updatedAt: nowIso(),
        version: Number(record.version || 1) + 1,
      })
    }),
  }))
}

export function deleteRecord(collection, recordId, { softDelete = false } = {}) {
  return updateDomainData(current => ({
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
  const data = readDomainData()
  return data.settings || {}
}

export function saveSettings(settings) {
  return updateDomainData(current => ({ ...current, settings: { ...(current.settings || {}), ...settings } }))
}

export function getActiveDriver() {
  return STORAGE_DRIVERS[activeStorageDriverName] || STORAGE_DRIVERS.localStorage
}

export function getDriverMode(driver = getActiveDriver()) {
  return {
    name: driver.name,
    supportsAsync: Boolean(driver.supportsAsync),
    supportsSync: Boolean(driver.supportsSync),
  }
}

export function executeRead(driver = getActiveDriver(), methodName = 'readDomainData') {
  const mode = getDriverMode(driver)

  // TODO: When the repository becomes async-aware, allow supportsAsync drivers
  // here and update hooks to await repository reads through an initialization
  // state. Until then, reads must remain synchronous for UI compatibility.
  if (!mode.supportsSync) {
    throw new Error(`Storage driver "${mode.name}" does not support synchronous reads yet.`)
  }

  return driver.driver[methodName]()
}

export function executeWrite(data, driver = getActiveDriver(), methodName = 'writeDomainData') {
  const mode = getDriverMode(driver)

  // TODO: Future SQLite activation should route writes through an async
  // repository API with explicit loading/error states before this guard changes.
  if (!mode.supportsSync) {
    throw new Error(`Storage driver "${mode.name}" does not support synchronous writes yet.`)
  }

  return driver.driver[methodName](data)
}

export function __setStorageDriverForTests(name, driverConfig) {
  STORAGE_DRIVERS[name] = driverConfig
  activeStorageDriverName = name
}

export function __resetStorageDriverForTests() {
  activeStorageDriverName = ACTIVE_STORAGE_DRIVER
  delete STORAGE_DRIVERS.test
}

function getCollectionWithoutRecord(data, collection, record) {
  return (data[collection] || []).filter(item => {
    const sameId = record.id && item.id === record.id
    const sameLocalId = record.localId && item.localId === record.localId
    return !sameId && !sameLocalId
  })
}
