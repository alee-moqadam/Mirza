function getSyncStatus() {
  return {
    status: 'disabled',
    service: 'mirza-sync',
    message: 'Sync scaffolding is available, but backend synchronization is not implemented yet.',
  }
}

function pushChanges(payload = {}) {
  return {
    accepted: true,
    persisted: false,
    receivedChanges: Array.isArray(payload.changes) ? payload.changes.length : 0,
    message: 'Push endpoint is a placeholder. No database write was performed.',
  }
}

function pullChanges() {
  return {
    changes: [],
    hasMore: false,
    message: 'Pull endpoint is a placeholder. No database read was performed.',
  }
}

module.exports = {
  getSyncStatus,
  pushChanges,
  pullChanges,
}
