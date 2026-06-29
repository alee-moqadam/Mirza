const syncService = require('../services/sync.service')

function getSyncStatus(req, res, next) {
  try {
    res.json(syncService.getSyncStatus())
  } catch (error) {
    next(error)
  }
}

function pushChanges(req, res, next) {
  try {
    res.json(syncService.pushChanges(req.body))
  } catch (error) {
    next(error)
  }
}

function pullChanges(req, res, next) {
  try {
    res.json(syncService.pullChanges())
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSyncStatus,
  pushChanges,
  pullChanges,
}
