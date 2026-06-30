import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  __resetStorageBootstrapForTests,
  getStorageInitializationStatus,
  initializeStorage,
  isStorageReady,
} from '../storageBootstrap.js'

afterEach(() => {
  __resetStorageBootstrapForTests()
})

test('initializeStorage returns a status object and marks storage ready', async () => {
  const status = await initializeStorage()

  assert.equal(typeof status, 'object')
  assert.equal(status.ready, true)
  assert.equal(isStorageReady(), true)
  assert.equal(getStorageInitializationStatus().ready, true)
})

test('initializeStorage prevents duplicate initialization', () => {
  const first = initializeStorage()
  const second = initializeStorage()

  assert.equal(first, second)
})
