import jalaali from 'jalaali-js'
import { normalizeDigits } from '../utils/numberFormat.js'

const { isValidJalaaliDate, toGregorian, toJalaali } = jalaali

const SETTLED = ['پرداخت شده', 'دریافت شده', 'تسویه‌شده', 'لغوشده']
const RECURRENCE_MONTHS = { ماهانه: 1, دوماهه: 2, سه‌ماهه: 3, 'شش‌ماهه': 6, سالیانه: 12, سالانه: 12 }
const pad = value => String(value).padStart(2, '0')
const RECURRENCE_DAYS = { روزانه: 1, هفتگی: 7 }
const lastGregorianDayOfMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

export function isoToJalali(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return `${jy}/${pad(jm)}/${pad(jd)}`
}

export function jalaliToIso(value) {
  if (!value) return ''
  const normalized = normalizeDigits(value).replace(/-/g, '/').trim()
  const [jy, jm, jd] = normalized.split('/').map(Number)
  if (!isValidJalaaliDate(jy, jm, jd)) return ''
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export const normalizeJalaliInput = value => {
  const digits = normalizeDigits(value).replace(/[^\d]/g, '').slice(0, 8)
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('/')
}

const dateOnly = value => {
  if (!value) return ''
  const text = String(value).trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0]
  return iso || text
}
export const compareDates = (a, b) => {
  const left = new Date(`${dateOnly(a)}T00:00:00`)
  const right = new Date(`${dateOnly(b)}T00:00:00`)
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return 0
  return left.getTime() - right.getTime()
}
export const daysUntil = value => value ? Math.ceil(compareDates(value, new Date()) / 86400000) : Infinity
export const isOverdue = item => daysUntil(item.dueDate) < 0 && !SETTLED.includes(item.status)
export const isNearDue = item => daysUntil(item.dueDate) >= 0 && daysUntil(item.dueDate) <= 7 && !SETTLED.includes(item.status)
export const dynamicStatus = item => isOverdue(item) ? 'عقب‌افتاده' : isNearDue(item) ? 'نزدیک سررسید' : item.status
export const inNext30Days = value => daysUntil(value) >= 0 && daysUntil(value) <= 30

export function currentJalaliMonthYear() {
  const now = new Date()
  const { jy, jm } = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return { year: jy, month: jm }
}

export function inCurrentMonth(value) {
  if (!value) return false
  const date = new Date(value)
  const target = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const current = currentJalaliMonthYear()
  return target.jy === current.year && target.jm === current.month
}

export function currentJalaliMonthEndIso() {
  const { year, month } = currentJalaliMonthYear()
  let day = 31
  while (!isValidJalaaliDate(year, month, day)) day -= 1
  const { gy, gm, gd } = toGregorian(year, month, day)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export function currentJalaliMonthStartIso() {
  const { year, month } = currentJalaliMonthYear()
  const { gy, gm, gd } = toGregorian(year, month, 1)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

const jalaliMonthParts = value => {
  if (!value) return null
  const jalali = String(value).includes('/') ? normalizeDigits(value) : isoToJalali(value)
  const [year, month] = jalali.split('/').map(Number)
  return year && month ? { year, month } : null
}

export function jalaliMonthStartIso(value) {
  const parts = jalaliMonthParts(value)
  if (!parts) return ''
  const { gy, gm, gd } = toGregorian(parts.year, parts.month, 1)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export function jalaliMonthEndIso(value) {
  const parts = jalaliMonthParts(value)
  if (!parts) return ''
  let day = 31
  while (!isValidJalaaliDate(parts.year, parts.month, day)) day -= 1
  const { gy, gm, gd } = toGregorian(parts.year, parts.month, day)
  return `${gy}-${pad(gm)}-${pad(gd)}`
}

export function isDueThroughCurrentJalaliMonth(value) {
  if (!value) return false
  return compareDates(value, currentJalaliMonthEndIso()) <= 0
}

export function nextDueDate(item) {
  const normalize = value => {
    const text = String(value || '').trim()
    if (!text) return ''
    return text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0] || jalaliToIso(text) || ''
  }
  const addInterval = (value, count = 1) => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    if (Number.isNaN(date.getTime())) return ''
    if (RECURRENCE_DAYS[item.recurrence]) {
      date.setUTCDate(date.getUTCDate() + RECURRENCE_DAYS[item.recurrence] * count)
      return date.toISOString().slice(0, 10)
    }
    if (!RECURRENCE_MONTHS[item.recurrence]) return ''
    const targetMonth = date.getUTCMonth() + RECURRENCE_MONTHS[item.recurrence] * count
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12)
    const monthIndex = ((targetMonth % 12) + 12) % 12
    const targetDay = Math.min(date.getUTCDate(), lastGregorianDayOfMonth(targetYear, monthIndex))
    const next = new Date(Date.UTC(targetYear, monthIndex, targetDay))
    return next.toISOString().slice(0, 10)
  }
  const anchor = normalize(item.startDate || item.loanStartDate || item.createdAt || item.dueDate)
  const currentDue = normalize(item.dueDate)
  if (!anchor) return ''
  if (!currentDue) return anchor
  let next = anchor
  let guard = 0
  while (compareDates(next, currentDue) <= 0 && guard < 240) {
    const candidate = addInterval(anchor, guard + 1)
    if (!candidate || candidate === next) return ''
    next = candidate
    guard += 1
  }
  return next
}
