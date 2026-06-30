import {
  readFinanceData as readLocalFinanceData,
  restoreSampleData as restoreLocalSampleData,
  writeFinanceData as writeLocalFinanceData,
} from '../../localStorageService'

// Active storage driver. This preserves the existing localStorage behavior
// exactly while the app prepares for a future SQLite switch.
export function readFinanceData() {
  return readLocalFinanceData()
}

export function writeFinanceData(data) {
  writeLocalFinanceData(data)
}

export function restoreSampleData() {
  return restoreLocalSampleData()
}
