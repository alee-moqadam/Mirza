export const NAV_SECTION_COLLECTIONS = {
  debts: ['debts'],
  incomes: ['incomes'],
  currentExpenses: ['currentExpenses'],
  settings: ['banks', 'financialContacts', 'expenseCategories', 'incomeCategories', 'tags', 'currency', 'theme', 'accent', 'fontSize', 'language', 'digitStyle', 'lockSettings', 'notificationSettings'],
}

const stableValue = value => {
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value
}
const collectionChanged = (previous = {}, next = {}, key) => stableValue(previous?.[key]) !== stableValue(next?.[key])

export function getAffectedNavSections(previousData = {}, nextData = {}) {
  const affected = new Set()
  for (const [section, keys] of Object.entries(NAV_SECTION_COLLECTIONS)) {
    if (keys.some(key => collectionChanged(previousData, nextData, key))) affected.add(section)
  }
  if (['debts', 'incomes', 'currentExpenses'].some(section => affected.has(section))) affected.add('dashboard')
  return [...affected]
}

export function markSectionsUnseen(state = {}, sections = [], activeSection = '') {
  return sections.reduce((next, section) => {
    if (!section || section === activeSection) return next
    return { ...next, [section]: true }
  }, state)
}

export function clearSectionUnseen(state = {}, section = '') {
  if (!section || !state[section]) return state
  return { ...state, [section]: false }
}

export const isSectionUnseen = (state = {}, section = '') => Boolean(state[section])
