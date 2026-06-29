import { readFinanceData, writeFinanceData } from '../localStorageService'

const STORAGE_KEY = 'personal-finance-persian-mvp'
const MIGRATION_FLAG_KEY = `${STORAGE_KEY}-offline-storage-migration-v1`

export function hasLegacyLocalStorageData() {
  return Boolean(localStorage.getItem(STORAGE_KEY))
}

export function hasCompletedStorageMigration() {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'completed'
}

export function getMigrationStatus() {
  return {
    hasLegacyData: hasLegacyLocalStorageData(),
    completed: hasCompletedStorageMigration(),
  }
}

export function runSafeMigration() {
  if (hasCompletedStorageMigration()) return getMigrationStatus()

  if (!hasLegacyLocalStorageData()) {
    markMigrationCompleted()
    return getMigrationStatus()
  }

  const migratedData = readFinanceData()
  writeFinanceData(migratedData)
  markMigrationCompleted()
  return getMigrationStatus()
}

function markMigrationCompleted() {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'completed')
  localStorage.setItem(`${MIGRATION_FLAG_KEY}-completed-at`, new Date().toISOString())
}
