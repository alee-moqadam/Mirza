import {
  deleteRecord as deleteRepositoryRecord,
  getRecords,
  getSettings as getRepositorySettings,
  saveRecord as saveRepositoryRecord,
  saveSettings as saveRepositorySettings,
  updateRecord as updateRepositoryRecord,
} from './storageRepository'

// Future local database boundary for SQLite/native storage.
// This first implementation intentionally delegates to the repository so the app
// can keep localStorage as the fallback and migration source.
export function initializeLocalDatabase() {
  return { ready: true, driver: 'localStorage-fallback' }
}

export function getAllRecords(collection) {
  return getRecords(collection)
}

export function saveRecord(collection, record) {
  return saveRepositoryRecord(collection, record)
}

export function updateRecord(collection, recordId, patch) {
  return updateRepositoryRecord(collection, recordId, patch)
}

export function deleteRecord(collection, recordId, options) {
  return deleteRepositoryRecord(collection, recordId, options)
}

export function getSettings() {
  return getRepositorySettings()
}

export function saveSettings(settings) {
  return saveRepositorySettings(settings)
}
