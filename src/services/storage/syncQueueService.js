import { SYNC_STATUS } from './storageRepository.js'

const queue = []

export { SYNC_STATUS }

export function createSyncQueueItem({ entityType, entityId, operation, payload }) {
  return {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    operation,
    payload,
    status: SYNC_STATUS.PENDING,
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastError: '',
  }
}

export function enqueuePendingChange(change) {
  const item = createSyncQueueItem(change)
  queue.push(item)
  return item
}

export function getPendingChanges() {
  return queue.filter(item => item.status === SYNC_STATUS.PENDING || item.status === SYNC_STATUS.FAILED)
}

export function updateQueueItemStatus(id, status, lastError = '') {
  const item = queue.find(change => change.id === id)
  if (!item) return null
  item.status = status
  item.lastError = lastError
  item.updatedAt = new Date().toISOString()
  if (status === SYNC_STATUS.FAILED) item.attempts += 1
  return item
}

export function clearSyncedChanges() {
  const remaining = queue.filter(item => item.status !== SYNC_STATUS.SYNCED)
  queue.splice(0, queue.length, ...remaining)
}
