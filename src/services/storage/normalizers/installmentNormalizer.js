import { normalizeDate, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeInstallment(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'installment'),
    loanId: entity.loanId || entity.loan_id || entity.parentId || null,
    dueDate: normalizeDate(entity.dueDate || entity.due_date, null),
    amount: normalizeNumber(entity.amount),
    paidAmount: normalizeNumber(entity.paidAmount || entity.paid_amount || entity.receivedAmount, 0),
    paymentRecordId: entity.paymentRecordId || entity.payment_record_id || null,
    status: normalizeText(entity.status, 'pending'),
    paidAt: normalizeDate(entity.paidAt || entity.paid_at || entity.paymentDate, null),
    notes: normalizeText(entity.notes || entity.description, ''),
  }
}
