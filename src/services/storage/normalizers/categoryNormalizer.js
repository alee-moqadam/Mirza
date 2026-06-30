import { normalizeBoolean, normalizeNumber, normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeCategory(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'category'),
    title: normalizeText(entity.title || entity.name, ''),
    type: normalizeText(entity.type || entity.categoryType, ''),
    parentId: entity.parentId || entity.parent_id || null,
    isSystem: normalizeBoolean(entity.isSystem ?? entity.is_system, false),
    displayOrder: normalizeNumber(entity.displayOrder || entity.display_order, 0),
    isActive: normalizeBoolean(entity.isActive ?? entity.is_active, true),
  }
}
