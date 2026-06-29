const { Router } = require('express')

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mirza-api',
  })
})

module.exports = router
