import { normalizeSyncMetadata, normalizeText, preservePayload } from './baseNormalizer.js'

export function normalizeSettings(entity = {}) {
  return {
    ...entity,
    ...preservePayload(entity),
    ...normalizeSyncMetadata(entity, 'settings'),
    userId: entity.userId || entity.user_id || null,
    locale: normalizeText(entity.locale, 'fa-IR'),
    calendar: normalizeText(entity.calendar, 'jalali'),
    currency: normalizeText(entity.currency, 'IRR'),
    notificationSettings: entity.notificationSettings || entity.notification_settings || {},
    lockSettings: entity.lockSettings || entity.lock_settings || {},
    theme: normalizeText(entity.theme, 'system'),
    preferences: entity.preferences || {},
  }
}
