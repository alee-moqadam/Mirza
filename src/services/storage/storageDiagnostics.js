import {
  getEntityById,
  initializeLocalDatabase,
  insertEntity,
  LOCAL_DATABASE_TABLES,
  softDeleteEntity,
  updateEntity,
} from './localDatabaseService.js'
import { initializeStorage } from './storageBootstrap.js'

const DIAGNOSTIC_PREFIX = 'diagnostic-record-'

export async function runStorageDiagnostics() {
  const localId = `${DIAGNOSTIC_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const startedAt = new Date().toISOString()
  const result = {
    ok: false,
    localId,
    startedAt,
    finishedAt: '',
    storage: null,
    database: null,
    steps: {
      initializeStorage: null,
      initializeLocalDatabase: null,
      insert: null,
      read: null,
      update: null,
      softDelete: null,
      verifySoftDelete: null,
    },
    error: null,
  }

  try {
    result.storage = await initializeStorage()
    result.steps.initializeStorage = { success: true }

    const databaseStatus = await initializeLocalDatabase()
    result.database = databaseStatus
    result.steps.initializeLocalDatabase = databaseStatus

    if (!databaseStatus.ready) {
      result.finishedAt = new Date().toISOString()
      return {
        ...result,
        ok: false,
        reason: 'sqlite-unavailable',
      }
    }

    const entity = {
      localId,
      type: 'diagnostic',
      title: 'Storage diagnostic record',
      amount: 0,
      createdAt: startedAt,
      updatedAt: startedAt,
      syncStatus: 'pending',
      version: 1,
      diagnostic: true,
    }

    result.steps.insert = await insertEntity(LOCAL_DATABASE_TABLES.RECORDS, entity)
    result.steps.read = await getEntityById(LOCAL_DATABASE_TABLES.RECORDS, localId)
    result.steps.update = await updateEntity(LOCAL_DATABASE_TABLES.RECORDS, localId, {
      title: 'Storage diagnostic record updated',
      diagnosticUpdated: true,
    })
    result.steps.softDelete = await softDeleteEntity(LOCAL_DATABASE_TABLES.RECORDS, localId)
    result.steps.verifySoftDelete = await getEntityById(LOCAL_DATABASE_TABLES.RECORDS, localId)

    result.ok = [
      result.steps.insert,
      result.steps.read,
      result.steps.update,
      result.steps.softDelete,
      result.steps.verifySoftDelete,
    ].every(step => step?.success)

    result.finishedAt = new Date().toISOString()
    return result
  } catch (error) {
    result.error = {
      message: error?.message || String(error),
    }
    result.finishedAt = new Date().toISOString()
    return result
  }
}
