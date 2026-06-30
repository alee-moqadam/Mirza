import {
  readFinanceData as readLocalFinanceData,
  restoreSampleData as restoreLocalSampleData,
  writeFinanceData as writeLocalFinanceData,
} from '../../localStorageService.js'
import { fromLegacyFinanceData, toLegacyFinanceData } from '../adapters/legacyFinanceAdapter.js'

// Active storage driver. This preserves the existing localStorage behavior
// exactly while the app prepares for a future SQLite switch.
export function readFinanceData() {
  return toLegacyFinanceData(fromLegacyFinanceData(readLocalFinanceData()))
}

export function writeFinanceData(data) {
  writeLocalFinanceData(toLegacyFinanceData(fromLegacyFinanceData(data)))
}

export function restoreSampleData() {
  return toLegacyFinanceData(fromLegacyFinanceData(restoreLocalSampleData()))
}

export function readDomainData() {
  return fromLegacyFinanceData(readLocalFinanceData())
}

export function writeDomainData(data) {
  writeLocalFinanceData(toLegacyFinanceData(data))
}

export function restoreDomainData() {
  return fromLegacyFinanceData(restoreLocalSampleData())
}
