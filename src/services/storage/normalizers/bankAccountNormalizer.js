import { normalizeBoolean, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeBankAccount(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'bank-account'),
    bankId: entity.bankId || entity.bank_id || null,
    ownerContactId: entity.ownerContactId || entity.owner_contact_id || entity.contactId || null,
    title: normalizeText(entity.title || entity.bank, ''),
    accountNumber: normalizeText(entity.accountNumber || entity.account_number || entity.account, ''),
    cardNumber: normalizeText(entity.cardNumber || entity.card_number || entity.card, ''),
    iban: normalizeText(entity.iban, ''),
    type: normalizeText(entity.type, 'bankAccount'),
    currency: normalizeText(entity.currency, 'IRR'),
    openingBalance: normalizeNumber(entity.openingBalance || entity.opening_balance, 0),
    currentBalance: normalizeNumber(entity.currentBalance || entity.current_balance, 0),
    isActive: normalizeBoolean(entity.isActive ?? entity.is_active, true),
  }
}
