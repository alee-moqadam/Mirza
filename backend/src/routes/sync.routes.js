const { Router } = require('express')
const {
  getSyncStatus,
  pullChanges,
  pushChanges,
} = require('../controllers/sync.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = Router()

router.use(authMiddleware)

router.get('/status', getSyncStatus)
router.post('/push', pushChanges)
router.get('/pull', pullChanges)

module.exports = router
