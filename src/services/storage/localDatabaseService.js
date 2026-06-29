import {
  deleteRecord as deleteRepositoryRecord,
  getRecords,
  getSettings as getRepositorySettings,
  saveRecord as saveRepositoryRecord,
  saveSettings as saveRepositorySettings,
  updateRecord as updateRepositoryRecord,
} from './storageRepository'
import { Capacitor } from '@capacitor/core'

export const LOCAL_DATABASE_TABLES = {
  RECORDS: 'records',
  LOANS: 'loans',
  INSTALLMENTS: 'installments',
  CHECKS: 'checks',
  FINANCIAL_CONTACTS: 'financial_contacts',
  BANKS: 'banks',
  BANK_ACCOUNTS: 'bank_accounts',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'sync_queue',
}

const DATABASE_NAME = 'mirza_local.db'
const DATABASE_VERSION = 1
const SQLITE_PACKAGE = '@capacitor-community/sqlite'

const fallbackStatus = {
  ready: false,
  driver: 'localStorage-fallback',
}

const tableSchemas = [
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.RECORDS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.LOANS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.INSTALLMENTS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    loan_local_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.CHECKS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.FINANCIAL_CONTACTS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.BANKS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.BANK_ACCOUNTS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    bank_local_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.CATEGORIES} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.SETTINGS} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    payload TEXT NOT NULL,
    sync_status TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.SYNC_QUEUE} (
    local_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_local_id TEXT,
    entity_server_id TEXT,
    operation TEXT NOT NULL,
    payload TEXT,
    status TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TEXT,
    updated_at TEXT,
    processed_at TEXT
  )`,
]

// SQLite is the future primary local storage boundary for native builds.
// localStorage remains the current active fallback and migration source.
// Data migration from localStorage into SQLite will be implemented later.
export async function initializeLocalDatabase() {
  if (!canUseNativeSQLite()) return fallbackStatus

  try {
    const sqliteModule = await import(/* @vite-ignore */ SQLITE_PACKAGE)
    const connection = new sqliteModule.SQLiteConnection(sqliteModule.CapacitorSQLite)
    const database = await connection.createConnection(DATABASE_NAME, false, 'no-encryption', DATABASE_VERSION, false)

    await database.open()
    await createTables(database)
    await connection.closeConnection(DATABASE_NAME, false)

    return {
      ready: true,
      driver: 'sqlite',
      database: DATABASE_NAME,
      version: DATABASE_VERSION,
    }
  } catch (error) {
    console.warn('SQLite initialization unavailable; using localStorage fallback.', error)
    return fallbackStatus
  }
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

function canUseNativeSQLite() {
  return typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform()
}

async function createTables(database) {
  await tableSchemas.reduce(
    (previous, schema) => previous.then(() => database.execute(schema)),
    Promise.resolve()
  )
}
