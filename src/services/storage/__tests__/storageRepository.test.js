import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  __resetStorageDriverForTests,
  __setStorageDriverForTests,
  deleteRecord,
  deleteRecordAsync,
  getRecords,
  getRecordsAsync,
  getSettings,
  getSettingsAsync,
  readDomainData,
  readDomainDataAsync,
  saveRecord,
  saveRecordAsync,
  saveSettings,
  saveSettingsAsync,
  updateDomainData,
  updateDomainDataAsync,
  updateRecord,
  updateRecordAsync,
  writeDomainData,
  writeDomainDataAsync,
} from '../storageRepository.js'

const baseState = () => ({
  records: [
    {
      localId: 'record-1',
      title: 'Initial',
      amount: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      syncStatus: 'synced',
      serverId: 'srv-1',
      lastSyncedAt: '2026-01-02T00:00:00.000Z',
      version: 3,
    },
  ],
  banks: [],
  categories: [],
  settings: {
    currency: 'IRR',
  },
})

let state
let writes

function installDriver({ read = () => state, write = data => { writes.push(data); state = data } } = {}) {
  __setStorageDriverForTests('test', {
    name: 'test',
    supportsSync: true,
    supportsAsync: false,
    driver: {
      readDomainData: read,
      writeDomainData: write,
    },
  })
}

beforeEach(() => {
  state = baseState()
  writes = []
  installDriver()
})

afterEach(() => {
  __resetStorageDriverForTests()
})

test('readDomainData normalizes metadata and preserves existing metadata', () => {
  const data = readDomainData()

  assert.equal(data.records[0].localId, 'record-1')
  assert.equal(data.records[0].serverId, 'srv-1')
  assert.equal(data.records[0].syncStatus, 'synced')
  assert.equal(data.records[0].lastSyncedAt, '2026-01-02T00:00:00.000Z')
  assert.equal(data.records[0].version, 3)
  assert.equal(data.records[0].deletedAt, null)
})

test('readDomainData handles missing collections', () => {
  state = { settings: { currency: 'IRR' } }
  const data = readDomainData()

  assert.equal(data.records, undefined)
  assert.deepEqual(data.settings, { currency: 'IRR' })
})

test('readDomainData handles an empty repository', () => {
  state = {}
  assert.deepEqual(readDomainData(), {})
})

test('writeDomainData normalizes localId, timestamps, version and sync defaults', () => {
  const written = writeDomainData({
    records: [{ title: 'No ID', amount: 25 }],
  })

  assert.equal(writes.length, 1)
  assert.equal(typeof written.records[0].localId, 'string')
  assert.ok(written.records[0].localId.length > 0)
  assert.equal(written.records[0].serverId, null)
  assert.equal(written.records[0].syncStatus, 'pending')
  assert.equal(written.records[0].lastSyncedAt, null)
  assert.equal(written.records[0].deletedAt, null)
  assert.equal(written.records[0].version, 1)
  assert.ok(written.records[0].createdAt)
  assert.ok(written.records[0].updatedAt)
})

test('writeDomainData replaces collections immutably', () => {
  const previous = state
  const written = writeDomainData({
    ...state,
    records: [{ localId: 'replacement', title: 'Replacement' }],
  })

  assert.equal(written.records.length, 1)
  assert.equal(written.records[0].localId, 'replacement')
  assert.equal(previous.records[0].localId, 'record-1')
  assert.notEqual(written.records, previous.records)
})

test('updateDomainData writes an immutable update', () => {
  const previous = state
  const updated = updateDomainData(current => ({
    ...current,
    records: current.records.map(record => ({ ...record, title: 'Changed' })),
  }))

  assert.equal(updated.records[0].title, 'Changed')
  assert.equal(previous.records[0].title, 'Initial')
  assert.notEqual(updated, previous)
  assert.equal(writes.length, 1)
})

test('saveRecord prepends a normalized record and preserves existing records', () => {
  const updated = saveRecord('records', { title: 'Inserted', amount: 50 })

  assert.equal(updated.records.length, 2)
  assert.equal(updated.records[0].title, 'Inserted')
  assert.equal(typeof updated.records[0].localId, 'string')
  assert.equal(updated.records[0].syncStatus, 'pending')
  assert.equal(updated.records[0].version, 1)
  assert.equal(updated.records[1].localId, 'record-1')
})

test('updateRecord applies patch immutably and increments version', () => {
  const previous = state
  const updated = updateRecord('records', 'record-1', { amount: 150 })

  assert.equal(updated.records[0].amount, 150)
  assert.equal(updated.records[0].version, 4)
  assert.ok(updated.records[0].updatedAt)
  assert.equal(previous.records[0].amount, 100)
  assert.equal(previous.records[0].version, 3)
})

test('updateRecord supports functional patches', () => {
  const updated = updateRecord('records', 'record-1', record => ({ amount: record.amount + 20 }))

  assert.equal(updated.records[0].amount, 120)
  assert.equal(updated.records[0].version, 4)
})

test('updateRecord leaves missing entities unchanged', () => {
  const previous = state
  const updated = updateRecord('records', 'missing', { amount: 999 })

  assert.equal(updated.records[0].amount, 100)
  assert.notEqual(updated, previous)
  assert.equal(writes.length, 1)
})

test('deleteRecord applies soft delete metadata', () => {
  const updated = deleteRecord('records', 'record-1', { softDelete: true })

  assert.equal(updated.records.length, 1)
  assert.equal(updated.records[0].syncStatus, 'deleted')
  assert.ok(updated.records[0].deletedAt)
})

test('deleteRecord removes entity when softDelete is false', () => {
  const updated = deleteRecord('records', 'record-1')

  assert.deepEqual(updated.records, [])
})

test('unknown collection can be created without affecting existing collections', () => {
  const updated = saveRecord('unknown_collection', { title: 'Unknown' })

  assert.equal(updated.unknown_collection.length, 1)
  assert.equal(updated.records.length, 1)
})

test('unknown collection delete writes an empty collection safely', () => {
  const updated = deleteRecord('unknown_collection', 'missing')

  assert.deepEqual(updated.unknown_collection, [])
  assert.equal(updated.records.length, 1)
})

test('getRecords returns an empty array for missing collections', () => {
  assert.deepEqual(getRecords('missing_collection'), [])
})

test('getSettings and saveSettings operate on domain settings', () => {
  assert.deepEqual(getSettings(), { currency: 'IRR' })

  const updated = saveSettings({ theme: 'dark' })

  assert.deepEqual(updated.settings, {
    currency: 'IRR',
    theme: 'dark',
  })
  assert.equal(writes.length, 1)
})

test('driver read errors bubble to callers', () => {
  installDriver({
    read: () => {
      throw new Error('read failed')
    },
  })

  assert.throws(() => readDomainData(), /read failed/)
})

test('driver write errors bubble to callers', () => {
  installDriver({
    write: () => {
      throw new Error('write failed')
    },
  })

  assert.throws(() => writeDomainData({ records: [] }), /write failed/)
})

test('invalid driver data is handled as an empty domain object', () => {
  installDriver({ read: () => null })

  assert.deepEqual(readDomainData(), {})
})

test('async APIs wrap sync drivers safely', async () => {
  const read = await readDomainDataAsync()
  assert.equal(read.records[0].localId, 'record-1')

  const written = await writeDomainDataAsync({ records: [{ title: 'Async Write' }] })
  assert.equal(writes.length, 1)
  assert.equal(written.records[0].title, 'Async Write')
  assert.equal(written.records[0].version, 1)

  const updatedDomain = await updateDomainDataAsync(current => ({
    ...current,
    records: current.records.map(record => ({ ...record, title: 'Async Updated' })),
  }))
  assert.equal(updatedDomain.records[0].title, 'Async Updated')
})

test('async record APIs wrap sync drivers safely', async () => {
  const saved = await saveRecordAsync('records', { title: 'Async Insert', amount: 10 })
  assert.equal(saved.records[0].title, 'Async Insert')
  assert.equal(saved.records.length, 2)

  const patched = await updateRecordAsync('records', saved.records[0].localId, { amount: 20 })
  assert.equal(patched.records[0].amount, 20)
  assert.equal(patched.records[0].version, 2)

  const records = await getRecordsAsync('records')
  assert.equal(records.length, 2)

  const softDeleted = await deleteRecordAsync('records', saved.records[0].localId, { softDelete: true })
  assert.equal(softDeleted.records[0].syncStatus, 'deleted')
})

test('async settings APIs wrap sync drivers safely', async () => {
  assert.deepEqual(await getSettingsAsync(), { currency: 'IRR' })

  const updated = await saveSettingsAsync({ theme: 'dark' })
  assert.deepEqual(updated.settings, {
    currency: 'IRR',
    theme: 'dark',
  })
})

test('async APIs await async drivers', async () => {
  let asyncWriteCalled = false
  __setStorageDriverForTests('test', {
    name: 'test',
    supportsSync: false,
    supportsAsync: true,
    driver: {
      readDomainData: async () => state,
      writeDomainData: async data => {
        asyncWriteCalled = true
        writes.push(data)
        state = data
      },
    },
  })

  const read = await readDomainDataAsync()
  assert.equal(read.records[0].localId, 'record-1')

  const saved = await saveRecordAsync('records', { title: 'Async Driver Insert' })
  assert.equal(asyncWriteCalled, true)
  assert.equal(saved.records[0].title, 'Async Driver Insert')
  assert.equal(writes.length, 1)
})

test('async APIs reject when async driver throws', async () => {
  __setStorageDriverForTests('test', {
    name: 'test',
    supportsSync: false,
    supportsAsync: true,
    driver: {
      readDomainData: async () => {
        throw new Error('async read failed')
      },
      writeDomainData: async () => {},
    },
  })

  await assert.rejects(() => readDomainDataAsync(), /async read failed/)
})
