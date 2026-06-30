import { sampleData } from '../data/sampleData.js'
import { APP_DATA_VERSION } from '../config/app.js'

const STORAGE_KEY = 'personal-finance-persian-mvp'
const BACKUP_KEY = `${STORAGE_KEY}-pre-v2-backup`
const BACKUP_PREFIX = 'mirzaBackupBeforeMigration_'
const CURRENT_VERSION = APP_DATA_VERSION

const cloneSeed = () => structuredClone(sampleData)
const createMigrationBackup = saved => {
  const sourceVersion = Number(saved?.appDataVersion || 1)
  const backupKey = `${BACKUP_PREFIX}v${sourceVersion}_to_v${CURRENT_VERSION}`
  if (!localStorage.getItem(backupKey)) {
    localStorage.setItem(backupKey, JSON.stringify({
      createdAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      data: saved,
    }))
  }
}
const normalizeBanks = banks => (banks || []).map(bank => ({ ...bank, hasCheckbook: Boolean(bank.hasCheckbook) }))
const normalizeContacts = contacts => (contacts || []).map(contact => {
  const bankAccounts = contact.bankAccounts?.length ? contact.bankAccounts : [{
    id: `${contact.id || crypto.randomUUID()}-bank-1`,
    bank: contact.bank || '',
    account: contact.account || '',
    card: contact.card || '',
    iban: contact.iban || '',
  }]
  const primary = bankAccounts[0] || {}
  return { ...contact, relationTitle: contact.relationTitle || '', bankAccounts, bank: contact.bank || primary.bank || '', account: contact.account || primary.account || '', card: contact.card || primary.card || '', iban: contact.iban || primary.iban || '' }
})
const normalizeFinanceData = data => {
  const shouldSeedGoals = !data.financialGoalsSeeded && !(data.financialGoals || []).length
  const horizonMap = { ماهانه: 'تا آخر ماه', 'سه‌ماهه': 'تا سه ماه دیگر', 'شش‌ماهه': 'تا شش ماه دیگر', 'یک‌ساله': 'تا آخر سال', 'چند ساله': 'تا آخر سال' }
  const financialGoals = (shouldSeedGoals ? cloneSeed().financialGoals : (data.financialGoals || []))
    .map(goal => ({ ...goal, horizon: horizonMap[goal.horizon] || goal.horizon || 'تا آخر ماه' }))
  return {
    ...data,
    banks: normalizeBanks(data.banks),
    financialContacts: normalizeContacts(data.financialContacts),
    financialGoals,
    financialGoalsSeeded: data.financialGoalsSeeded || shouldSeedGoals || financialGoals.length > 0,
  }
}

export function readFinanceData() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    const seed = normalizeFinanceData({ ...cloneSeed(), appDataVersion: CURRENT_VERSION })
    writeFinanceData(seed)
    return seed
  }

  try {
    return migrateFinanceData(JSON.parse(saved))
  } catch {
    localStorage.setItem(`${BACKUP_PREFIX}invalid_${Date.now()}`, saved)
    return normalizeFinanceData({ ...cloneSeed(), appDataVersion: CURRENT_VERSION })
  }
}

export function migrateFinanceData(saved) {
  if (Number(saved.appDataVersion || 1) >= CURRENT_VERSION) return normalizeFinanceData({ ...cloneSeed(), ...saved })
  createMigrationBackup(saved)
  if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, JSON.stringify(saved))
  const oldChecks = saved.checksAndDebts || []
  const receivableChecks = oldChecks.filter(item => item.relation === 'دریافتنی' && item.isCheck).map(item => ({
    ...item, id: `income-check-${item.id}`, incomeType: 'چک دریافتی', category: 'چک دریافتی',
    receivedAmount: ['دریافت شده', 'تسویه‌شده'].includes(item.status) ? item.amount : 0,
    status: ['دریافت شده', 'تسویه‌شده'].includes(item.status) ? 'دریافت شده' : 'دریافت نشده',
    direction: 'receivable', tags: [...new Set([...(item.tags || []), 'چک دریافتی'])],
  }))
  const debts = [
    ...(saved.expenses || []).map(item => ({ ...item, relation: 'پرداختنی', direction: 'payable', legacyExpense: true })),
    ...oldChecks.filter(item => item.relation !== 'دریافتنی').map(item => ({ ...item, direction: 'payable' })),
  ]
  const migrated = {
    ...cloneSeed(), ...saved, appDataVersion: CURRENT_VERSION, debts,
    currentExpenses: saved.currentExpenses || [],
    incomes: [...(saved.incomes || []), ...receivableChecks],
    notifications: saved.notifications || [],
    financialGoals: saved.financialGoals || cloneSeed().financialGoals,
    financialGoalsSeeded: true,
    notificationSettings: saved.notificationSettings || { enabled: false, sentIds: [] },
    lockSettings: saved.lockSettings || { enabled: false, passcodeHash: '', autoLock: 'فوری', biometricCredentialId: '' },
    legacyBackupCreatedAt: new Date().toISOString(),
  }
  writeFinanceData(migrated)
  return normalizeFinanceData(migrated)
}

export function writeFinanceData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFinanceData(data)))
}

export function restoreSampleData() {
  const seed = { ...cloneSeed(), appDataVersion: CURRENT_VERSION }
  writeFinanceData(seed)
  return seed
}
