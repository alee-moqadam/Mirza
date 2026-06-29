import { SYNC_STATUS } from './storageRepository'
import { getPendingChanges, updateQueueItemStatus } from './syncQueueService'

const SYNC_ENABLED = false

export function canSync() {
  return SYNC_ENABLED && navigator.onLine
}

export function syncPendingChanges() {
  if (!canSync()) {
    return { synced: 0, skipped: true, reason: 'sync-disabled' }
  }

  return {
    synced: 0,
    skipped: true,
    reason: 'backend-not-configured',
    pending: getPendingChanges().length,
  }
}

export function markSynced(queueItemId) {
  return updateQueueItemStatus(queueItemId, SYNC_STATUS.SYNCED)
}

export function markFailed(queueItemId, error) {
  return updateQueueItemStatus(queueItemId, SYNC_STATUS.FAILED, error?.message || String(error || 'Sync failed'))
}
