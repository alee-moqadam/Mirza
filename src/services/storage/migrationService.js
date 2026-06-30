import { readFinanceData } from '../localStorageService'
import { normalizeLegacyFinanceData } from './normalizers'

const STORAGE_KEY = 'personal-finance-persian-mvp'
const MIGRATION_FLAG_KEY = `${STORAGE_KEY}-offline-storage-migration-v1`
const MIGRATION_IN_PROGRESS_KEY = `${MIGRATION_FLAG_KEY}-in-progress`
const MIGRATION_LAST_FAILED_REASON_KEY = `${MIGRATION_FLAG_KEY}-last-failed-reason`
const MIGRATION_LAST_FAILED_AT_KEY = `${MIGRATION_FLAG_KEY}-last-failed-at`

let skipMigrationRetryForRuntime = false

const COLLECTION_TABLE_MAP = {
  banks: 'banks',
  categories: 'categories',
  financial_contacts: 'financial_contacts',
  records: 'records',
}

const LEGACY_COLLECTIONS = [
  'debts',
  'incomes',
  'currentExpenses',
  'histories',
  'banks',
  'financialContacts',
  'expenseCategories',
  'incomeCategories',
]

export function hasLegacyLocalStorageData() {
  return Boolean(localStorage.getItem(STORAGE_KEY))
}

export function hasCompletedStorageMigration() {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'completed'
}

export function getMigrationStatus(extra = {}) {
  return {
    hasLegacyData: hasLegacyLocalStorageData(),
    completed: hasCompletedStorageMigration(),
    inProgress: localStorage.getItem(MIGRATION_IN_PROGRESS_KEY) === 'true',
    lastFailedReason: localStorage.getItem(MIGRATION_LAST_FAILED_REASON_KEY) || '',
    lastFailedAt: localStorage.getItem(MIGRATION_LAST_FAILED_AT_KEY) || '',
    driver: 'localStorage-fallback',
    ...extra,
  }
}

export function shouldSkipMigrationRetry() {
  return skipMigrationRetryForRuntime
}

export function readLegacyData() {
  if (!hasLegacyLocalStorageData()) {
    return {
      success: false,
      reason: 'legacy-data-not-found',
      data: null,
    }
  }

  try {
    return {
      success: true,
      data: readFinanceData(),
    }
  } catch (error) {
    return {
      success: false,
      reason: 'legacy-data-read-failed',
      error,
      data: null,
    }
  }
}

export function validateLegacyData(data) {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Legacy data is missing or invalid.'],
      warnings: [],
    }
  }

  const warnings = LEGACY_COLLECTIONS
    .filter(collection => data[collection] && !Array.isArray(data[collection]))
    .map(collection => `${collection} is not an array and will be skipped.`)

  return {
    valid: true,
    errors: [],
    warnings,
  }
}

export function normalizeLegacyData(data) {
  return normalizeLegacyFinanceData(data)
}

export async function writeNormalizedDataToSQLite(normalizedData) {
  try {
    const {
      initializeLocalDatabase,
      insertEntity,
    } = await import('./localDatabaseService')
    const status = await initializeLocalDatabase()

    if (!status.ready) {
      return {
        success: false,
        driver: status.driver || 'localStorage-fallback',
        reason: 'sqlite-unavailable',
        written: 0,
      }
    }

    const entities = getMigratableEntities(normalizedData)
    const results = []

    for (const { tableName, entity } of entities) {
      results.push(await insertEntity(tableName, entity))
    }

    const failed = results.filter(result => !result.success)

    return {
      success: failed.length === 0,
      driver: 'sqlite',
      written: results.length - failed.length,
      failed: failed.length,
    }
  } catch (error) {
    return {
      success: false,
      driver: 'localStorage-fallback',
      reason: 'sqlite-write-failed',
      written: 0,
      error,
    }
  }
}

export function verifyMigration(normalizedData, writeResult) {
  const expected = getMigratableEntities(normalizedData).length
  const written = Number(writeResult?.written || 0)

  return {
    success: Boolean(writeResult?.success) && written === expected,
    expected,
    written,
  }
}

export function markMigrationCompleted() {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'completed')
  localStorage.setItem(`${MIGRATION_FLAG_KEY}-completed-at`, new Date().toISOString())
  localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
  localStorage.removeItem(MIGRATION_LAST_FAILED_REASON_KEY)
  localStorage.removeItem(MIGRATION_LAST_FAILED_AT_KEY)
  skipMigrationRetryForRuntime = false
  return getMigrationStatus({ driver: 'sqlite' })
}

// Foundation for real migration. localStorage remains the fallback and active
// repository source until a later step explicitly switches the storage driver.
// SQLite does not become primary here.
export function runSafeMigration() {
  if (hasCompletedStorageMigration()) return getMigrationStatus({ skipped: true, reason: 'already-completed' })
  if (localStorage.getItem(MIGRATION_IN_PROGRESS_KEY) === 'true') return getMigrationStatus({ skipped: true, reason: 'already-running' })
  if (shouldSkipMigrationRetry()) return getMigrationStatus({ skipped: true, reason: 'runtime-retry-disabled' })
  if (!hasLegacyLocalStorageData()) return getMigrationStatus({ skipped: true, reason: 'legacy-data-not-found' })

  localStorage.setItem(MIGRATION_IN_PROGRESS_KEY, 'true')

  runMigrationPipeline().catch(error => {
    console.warn('Storage migration pipeline failed; continuing with localStorage fallback.', error)
    recordMigrationFailure('migration-pipeline-error')
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
  })

  return getMigrationStatus({ started: true })
}

async function runMigrationPipeline() {
  const legacy = readLegacyData()
  if (!legacy.success) {
    recordMigrationFailure(legacy.reason)
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
    return getMigrationStatus({ success: false, reason: legacy.reason })
  }

  const validation = validateLegacyData(legacy.data)
  if (!validation.valid) {
    recordMigrationFailure('legacy-data-validation-failed')
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
    return getMigrationStatus({ success: false, validation })
  }

  const normalizedData = normalizeLegacyData(legacy.data)
  const writeResult = await writeNormalizedDataToSQLite(normalizedData)

  if (!writeResult.success) {
    recordMigrationFailure(writeResult.reason || 'sqlite-write-failed')
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
    return getMigrationStatus({ success: false, writeResult })
  }

  const verification = verifyMigration(normalizedData, writeResult)
  if (!verification.success) {
    recordMigrationFailure('migration-verification-failed')
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY)
    return getMigrationStatus({ success: false, verification })
  }

  return markMigrationCompleted()
}

function getMigratableEntities(data = {}) {
  return Object.entries(COLLECTION_TABLE_MAP).flatMap(([normalizedCollection, tableName]) => (
    Array.isArray(data[normalizedCollection])
      ? data[normalizedCollection].map(entity => ({ tableName, entity }))
      : []
  ))
}

function recordMigrationFailure(reason) {
  skipMigrationRetryForRuntime = true
  localStorage.setItem(MIGRATION_LAST_FAILED_REASON_KEY, reason || 'unknown')
  localStorage.setItem(MIGRATION_LAST_FAILED_AT_KEY, new Date().toISOString())
}
