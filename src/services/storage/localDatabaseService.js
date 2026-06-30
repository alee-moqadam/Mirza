import {
  deleteRecord as deleteRepositoryRecord,
  getRecords,
  getSettings as getRepositorySettings,
  saveRecord as saveRepositoryRecord,
  saveSettings as saveRepositorySettings,
  updateRecord as updateRepositoryRecord,
} from './storageRepository.js'
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

const COMMON_ENTITY_COLUMNS = `
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    user_id TEXT,
    device_id TEXT,
    payload TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_status TEXT,
    last_synced_at TEXT,
    version INTEGER DEFAULT 1
`

const tableSchemas = [
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.RECORDS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.LOANS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.INSTALLMENTS} (
    loan_local_id TEXT,
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.CHECKS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.FINANCIAL_CONTACTS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.BANKS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.BANK_ACCOUNTS} (
    bank_local_id TEXT,
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.CATEGORIES} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.SETTINGS} (
${COMMON_ENTITY_COLUMNS}
  )`,
  `CREATE TABLE IF NOT EXISTS ${LOCAL_DATABASE_TABLES.SYNC_QUEUE} (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    user_id TEXT,
    device_id TEXT,
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
    deleted_at TEXT,
    sync_status TEXT,
    last_synced_at TEXT,
    processed_at TEXT,
    version INTEGER DEFAULT 1
  )`,
]

// SQLite is the future primary local storage boundary for native builds.
// localStorage remains the current active fallback and migration source.
// Data migration from localStorage into SQLite will be implemented later.
export async function initializeLocalDatabase() {
  const database = await openLocalDatabase()
  if (!database) return fallbackStatus

  try {
    await createTables(database)
    await closeLocalDatabase()

    return {
      ready: true,
      driver: 'sqlite',
      database: DATABASE_NAME,
      version: DATABASE_VERSION,
    }
  } catch (error) {
    console.warn('SQLite initialization unavailable; using localStorage fallback.', error)
    await closeLocalDatabase()
    return fallbackStatus
  }
}

let sqliteConnection = null
let sqliteDatabase = null

export async function openLocalDatabase() {
  if (!canUseNativeSQLite()) return null
  if (sqliteDatabase) return sqliteDatabase

  try {
    const sqliteModule = await import(/* @vite-ignore */ SQLITE_PACKAGE)
    sqliteConnection = new sqliteModule.SQLiteConnection(sqliteModule.CapacitorSQLite)
    sqliteDatabase = await sqliteConnection.createConnection(DATABASE_NAME, false, 'no-encryption', DATABASE_VERSION, false)
    await sqliteDatabase.open()
    return sqliteDatabase
  } catch (error) {
    console.warn('SQLite open unavailable; using localStorage fallback.', error)
    sqliteConnection = null
    sqliteDatabase = null
    return null
  }
}

export async function closeLocalDatabase() {
  if (!sqliteConnection) return fallbackResult()

  try {
    await sqliteConnection.closeConnection(DATABASE_NAME, false)
    sqliteConnection = null
    sqliteDatabase = null
    return { success: true, driver: 'sqlite' }
  } catch (error) {
    console.warn('SQLite close failed; keeping localStorage fallback available.', error)
    sqliteConnection = null
    sqliteDatabase = null
    return fallbackResult(error)
  }
}

export async function executeSql(sql, params = []) {
  const database = await openLocalDatabase()
  if (!database) return fallbackResult()

  try {
    const result = await database.run(sql, params)
    return { success: true, driver: 'sqlite', result }
  } catch (error) {
    console.warn('SQLite execute failed; using localStorage fallback.', error)
    return fallbackResult(error)
  }
}

export async function querySql(sql, params = []) {
  const database = await openLocalDatabase()
  if (!database) return { success: false, driver: 'localStorage-fallback', rows: [] }

  try {
    const result = await database.query(sql, params)
    return { success: true, driver: 'sqlite', rows: result.values || [] }
  } catch (error) {
    console.warn('SQLite query failed; using localStorage fallback.', error)
    return { success: false, driver: 'localStorage-fallback', rows: [], error }
  }
}

export async function insertEntity(tableName, entity) {
  if (!isAllowedTable(tableName)) return fallbackEntityResult(null)

  const now = nowIso()
  const row = normalizeEntityRow(entity, now)
  const sql = `INSERT OR REPLACE INTO ${tableName} (
    local_id,
    server_id,
    user_id,
    device_id,
    payload,
    created_at,
    updated_at,
    deleted_at,
    sync_status,
    last_synced_at,
    version
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  const params = [
    row.localId,
    row.serverId,
    row.userId,
    row.deviceId,
    JSON.stringify(entity || {}),
    row.createdAt,
    row.updatedAt,
    row.deletedAt,
    row.syncStatus,
    row.lastSyncedAt,
    row.version,
  ]
  const result = await executeSql(sql, params)
  if (!result.success) return fallbackEntityResult(null, result.error)
  return { success: true, driver: 'sqlite', entity: { ...entity, localId: row.localId } }
}

export async function updateEntity(tableName, localId, patch) {
  if (!isAllowedTable(tableName) || !localId) return fallbackEntityResult(null)

  const existing = await getEntityById(tableName, localId)
  if (!existing.entity) return fallbackEntityResult(null)

  const nextEntity = {
    ...existing.entity,
    ...patch,
    localId,
    updatedAt: nowIso(),
    version: Number(existing.entity.version || 1) + 1,
  }
  return insertEntity(tableName, nextEntity)
}

export async function getEntityById(tableName, localId) {
  if (!isAllowedTable(tableName) || !localId) return fallbackEntityResult(null)

  const result = await querySql(`SELECT * FROM ${tableName} WHERE local_id = ? LIMIT 1`, [localId])
  if (!result.success || !result.rows.length) return fallbackEntityResult(null, result.error)
  return { success: true, driver: 'sqlite', entity: rowToEntity(result.rows[0]) }
}

export async function getEntities(tableName, options = {}) {
  if (!isAllowedTable(tableName)) return { success: false, driver: 'localStorage-fallback', entities: [] }

  const includeDeleted = Boolean(options.includeDeleted)
  const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 100
  const offset = Number.isFinite(Number(options.offset)) ? Math.max(0, Number(options.offset)) : 0
  const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL'
  const result = await querySql(`SELECT * FROM ${tableName} ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [limit, offset])

  if (!result.success) return { success: false, driver: 'localStorage-fallback', entities: [], error: result.error }
  return { success: true, driver: 'sqlite', entities: result.rows.map(rowToEntity) }
}

export async function softDeleteEntity(tableName, localId) {
  if (!isAllowedTable(tableName) || !localId) return fallbackEntityResult(null)

  const existing = await getEntityById(tableName, localId)
  if (!existing.entity) return fallbackEntityResult(null)

  return updateEntity(tableName, localId, {
    deletedAt: nowIso(),
    syncStatus: 'deleted',
  })
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

function isAllowedTable(tableName) {
  return Object.values(LOCAL_DATABASE_TABLES).includes(tableName)
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeEntityRow(entity = {}, fallbackTimestamp = nowIso()) {
  return {
    localId: entity.localId || entity.local_id || createFallbackLocalId(),
    serverId: entity.serverId || entity.server_id || null,
    userId: entity.userId || entity.user_id || null,
    deviceId: entity.deviceId || entity.device_id || null,
    createdAt: entity.createdAt || entity.created_at || fallbackTimestamp,
    updatedAt: entity.updatedAt || entity.updated_at || fallbackTimestamp,
    deletedAt: entity.deletedAt || entity.deleted_at || null,
    syncStatus: entity.syncStatus || entity.sync_status || 'pending',
    lastSyncedAt: entity.lastSyncedAt || entity.last_synced_at || null,
    version: Number(entity.version || 1),
  }
}

function rowToEntity(row) {
  const payload = safeParsePayload(row.payload)
  return {
    ...payload,
    localId: row.local_id,
    serverId: row.server_id || payload.serverId || null,
    userId: row.user_id || payload.userId || null,
    deviceId: row.device_id || payload.deviceId || null,
    createdAt: row.created_at || payload.createdAt,
    updatedAt: row.updated_at || payload.updatedAt,
    deletedAt: row.deleted_at || payload.deletedAt || null,
    syncStatus: row.sync_status || payload.syncStatus || 'pending',
    lastSyncedAt: row.last_synced_at || payload.lastSyncedAt || null,
    version: Number(row.version || payload.version || 1),
  }
}

function safeParsePayload(payload) {
  try {
    return payload ? JSON.parse(payload) : {}
  } catch {
    return {}
  }
}

function fallbackResult(error = null) {
  return {
    success: false,
    driver: 'localStorage-fallback',
    error,
  }
}

function fallbackEntityResult(entity = null, error = null) {
  return {
    success: false,
    driver: 'localStorage-fallback',
    entity,
    error,
  }
}

function createFallbackLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
