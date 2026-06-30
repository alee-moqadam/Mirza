import { initializeLocalDatabase } from './localDatabaseService.js'
import { runSafeMigration } from './migrationService.js'

let initializationPromise = null
let initializationStatus = {
  ready: false,
  initialized: false,
  inProgress: false,
  sqlite: null,
  migration: null,
  error: null,
}

export function initializeStorage() {
  if (initializationPromise) return initializationPromise

  initializationStatus = {
    ...initializationStatus,
    inProgress: true,
  }

  initializationPromise = runInitialization()
  return initializationPromise
}

export function isStorageReady() {
  return Boolean(initializationStatus.ready)
}

export function getStorageInitializationStatus() {
  return { ...initializationStatus }
}

async function runInitialization() {
  try {
    const sqlite = await initializeLocalDatabase()
    const migration = runSafeMigration()

    initializationStatus = {
      ready: true,
      initialized: true,
      inProgress: false,
      sqlite,
      migration,
      error: null,
    }

    return getStorageInitializationStatus()
  } catch (error) {
    initializationStatus = {
      ready: true,
      initialized: false,
      inProgress: false,
      sqlite: null,
      migration: null,
      error,
    }

    return getStorageInitializationStatus()
  }
}
