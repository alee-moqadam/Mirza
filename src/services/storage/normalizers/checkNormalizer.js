import { normalizeDate, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer'

export function normalizeCheck(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'check'),
    checkNumber: normalizeText(entity.checkNumber || entity.check_number, ''),
    bankAccountId: entity.bankAccountId || entity.bank_account_id || null,
    contactId: entity.contactId || entity.contact_id || entity.contact || null,
    amount: normalizeNumber(entity.amount),
    issueDate: normalizeDate(entity.issueDate || entity.issue_date || entity.startDate, null),
    dueDate: normalizeDate(entity.dueDate || entity.due_date, null),
    direction: normalizeText(entity.direction, entity.relation === 'دریافتنی' ? 'receivable' : 'payable'),
    status: normalizeText(entity.status, 'issued'),
    linkedRecordIds: Array.isArray(entity.linkedRecordIds) ? entity.linkedRecordIds : [],
    notes: normalizeText(entity.notes || entity.description, ''),
  }
}
