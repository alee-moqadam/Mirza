const express = require('express')
const cors = require('cors')
const healthRoutes = require('./routes/health.routes')
const syncRoutes = require('./routes/sync.routes')
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/health', healthRoutes)
app.use('/sync', syncRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
