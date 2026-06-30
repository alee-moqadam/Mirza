import { normalizeBoolean, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer'

export function normalizeBank(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'bank'),
    title: normalizeText(entity.title || entity.name, ''),
    code: normalizeText(entity.code, ''),
    icon: normalizeText(entity.icon, ''),
    displayOrder: normalizeNumber(entity.displayOrder || entity.display_order, 0),
    isActive: normalizeBoolean(entity.isActive ?? entity.is_active, true),
  }
}
