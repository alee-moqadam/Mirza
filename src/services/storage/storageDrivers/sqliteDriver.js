import {
  getEntities,
  initializeLocalDatabase,
  insertEntity,
  LOCAL_DATABASE_TABLES,
} from '../localDatabaseService'

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

export function readFinanceData() {
  return {
    ...notReadyResponse,
    data: null,
  }
}

export function writeFinanceData() {
  return {
    ...notReadyResponse,
    saved: false,
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
