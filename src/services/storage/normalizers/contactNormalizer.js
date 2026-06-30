import { normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeContact(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'contact'),
    title: normalizeText(entity.title || entity.name, ''),
    relationTitle: normalizeText(entity.relationTitle || entity.relation_title, ''),
    mobile: normalizeText(entity.mobile, ''),
    phone: normalizeText(entity.phone, ''),
    email: normalizeText(entity.email, ''),
    address: normalizeText(entity.address, ''),
    notes: normalizeText(entity.notes || entity.description, ''),
  }
}
