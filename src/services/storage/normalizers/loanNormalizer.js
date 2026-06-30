import { normalizeDate, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeLoan(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'loan'),
    title: normalizeText(entity.title, ''),
    contactId: entity.contactId || entity.contact_id || entity.contact || null,
    principalAmount: normalizeNumber(entity.principalAmount || entity.principal_amount || entity.amount),
    remainingAmount: normalizeNumber(entity.remainingAmount || entity.remaining_amount || entity.amount),
    interestRate: normalizeNumber(entity.interestRate || entity.interest_rate, 0),
    startDate: normalizeDate(entity.startDate || entity.start_date, null),
    endDate: normalizeDate(entity.endDate || entity.end_date, null),
    direction: normalizeText(entity.direction, entity.relation === 'دریافتنی' ? 'receivable' : 'payable'),
    status: normalizeText(entity.status, 'active'),
    notes: normalizeText(entity.notes || entity.description, ''),
  }
}
