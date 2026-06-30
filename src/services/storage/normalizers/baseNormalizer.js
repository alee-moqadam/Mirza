export function nowIso() {
  return new Date().toISOString()
}

export function createLocalId(prefix = 'entity') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeSyncMetadata(entity = {}, prefix = 'entity') {
  const createdAt = normalizeDate(entity.createdAt || entity.created_at, nowIso())
  const updatedAt = normalizeDate(entity.updatedAt || entity.updated_at, createdAt)

  return {
    localId: entity.localId || entity.local_id || entity.id || createLocalId(prefix),
    serverId: entity.serverId || entity.server_id || null,
    createdAt,
    updatedAt,
    deletedAt: normalizeDate(entity.deletedAt || entity.deleted_at, null),
    syncStatus: normalizeText(entity.syncStatus || entity.sync_status, 'pending'),
    lastSyncedAt: normalizeDate(entity.lastSyncedAt || entity.last_synced_at, null),
    version: normalizeNumber(entity.version, 1),
  }
}

export function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

export function normalizeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeBoolean(value, fallback = false) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

export function normalizeDate(value, fallback = null) {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

export function preservePayload(entity = {}) {
  return {
    legacyPayload: { ...entity },
  }
}
