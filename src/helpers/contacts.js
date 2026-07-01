export function maskSensitive(value, type) {
  if (!value) return 'ثبت نشده'
  return type === 'iban'
    ? `${value.slice(0, 4)} **** **** **** ${value.slice(-4)}`
    : `${value.slice(0, 4)} **** **** ${value.slice(-4)}`
}

export function contactDetails(contact) {
  const accounts = contact.bankAccounts?.length ? contact.bankAccounts : [{ bank: contact.bank, account: contact.account, card: contact.card, iban: contact.iban }]
  return {
    نام: contact.title,
    عنوان: contact.relationTitle,
    موبایل: contact.mobile,
    'حساب‌های بانکی': accounts.map((item, index) => `${index + 1}. ${item.bank || 'بدون بانک'} | حساب: ${item.account || 'ثبت نشده'} | کارت: ${item.card || 'ثبت نشده'} | شبا: ${item.iban || 'ثبت نشده'}`).join('\n'),
    'کد ملی': contact.nationalId,
    توضیحات: contact.description,
  }
}

export const CONTACT_SUGGESTION_SAVE_MODES = {
  updateExisting: 'update_existing',
  createNew: 'create_new',
}

export function getContactSuggestionFields(suggestion = {}) {
  const fields = [
    ['شماره تماس', suggestion.mobile],
    ['کد ملی', suggestion.nationalId],
    ['بانک', suggestion.bankAccount?.bank],
    ['شماره کارت', suggestion.bankAccount?.card],
    ['شماره شبا', suggestion.bankAccount?.iban],
    ['شماره حساب', suggestion.bankAccount?.account],
    ['توضیحات', suggestion.description],
  ]
  return fields
    .map(([label, value]) => ({ label, value: String(value || '').trim() }))
    .filter(field => field.value)
}

export function mergeBankAccount(accounts = [], nextAccount) {
  if (!nextAccount || ![nextAccount.bank, nextAccount.account, nextAccount.iban, nextAccount.card].some(Boolean)) return accounts
  const index = accounts.findIndex(account =>
    (nextAccount.id && account.id === nextAccount.id) ||
    (nextAccount.card && account.card === nextAccount.card) ||
    (nextAccount.iban && account.iban === nextAccount.iban) ||
    (nextAccount.account && nextAccount.bank && account.account === nextAccount.account && account.bank === nextAccount.bank)
  )
  if (index === -1) return [{ ...nextAccount, id: nextAccount.id || crypto.randomUUID() }, ...accounts]
  return accounts.map((account, i) => i === index ? { ...account, ...nextAccount, id: account.id || nextAccount.id || crypto.randomUUID() } : account)
}

export function applyContactSuggestion(current, suggestion, mode = CONTACT_SUGGESTION_SAVE_MODES.createNew, targetId = '') {
  if (!suggestion) return current
  const now = new Date().toISOString()
  const contacts = current.financialContacts || []
  const normalizedMode = mode === 'update' ? CONTACT_SUGGESTION_SAVE_MODES.updateExisting : mode
  const existing = normalizedMode === CONTACT_SUGGESTION_SAVE_MODES.updateExisting
    ? contacts.find(contact => contact.id === targetId) || contacts.find(contact => contact.title === suggestion.title)
    : null

  if (existing) {
    return {
      ...current,
      financialContacts: contacts.map(contact => {
        if (contact.id !== existing.id) return contact
        const bankAccounts = mergeBankAccount(contact.bankAccounts || [], suggestion.bankAccount)
        const primary = bankAccounts[0] || {}
        return {
          ...contact,
          mobile: suggestion.mobile || contact.mobile || '',
          nationalId: suggestion.nationalId || contact.nationalId || '',
          bank: primary.bank || contact.bank || '',
          account: primary.account || contact.account || '',
          iban: primary.iban || contact.iban || '',
          card: primary.card || contact.card || '',
          bankAccounts,
          updatedAt: now,
        }
      }),
    }
  }

  const bankAccounts = mergeBankAccount([], suggestion.bankAccount)
  return {
    ...current,
    financialContacts: [{
      id: crypto.randomUUID(),
      title: suggestion.title,
      type: 'شخصی',
      mobile: suggestion.mobile || '',
      nationalId: suggestion.nationalId || '',
      bank: bankAccounts[0]?.bank || '',
      account: bankAccounts[0]?.account || '',
      iban: bankAccounts[0]?.iban || '',
      card: bankAccounts[0]?.card || '',
      bankAccounts,
      description: suggestion.description || 'ثبت‌شده از فرم مالی',
      createdAt: now,
      updatedAt: now,
    }, ...contacts],
  }
}
