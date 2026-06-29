import { isoToJalali } from './dates'
import { localizeDigits, normalizeDigits } from '../utils/numberFormat'

export const CURRENCY_SYMBOLS = { تومان: 'تومان', ریال: 'ریال', یورو: '€', دلار: '$' }
export const formatNumber = (value = 0) => localizeDigits(Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }))
export const parseFormattedNumber = value => Number(normalizeDigits(value).replace(/,/g, '').replace(/[^\d.-]/g, '') || 0)
export const number = formatNumber
export const money = (value = 0, currency = 'تومان') => `${formatNumber(value)} ${CURRENCY_SYMBOLS[currency] || currency}`
export const dateLabel = value => value ? localizeDigits(isoToJalali(value)) : 'بدون تاریخ'

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون']

function threeDigitsToWords(value) {
  const parts = []
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  if (hundred) parts.push(HUNDREDS[hundred])
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10])
  else {
    const ten = Math.floor(rest / 10)
    const one = rest % 10
    if (ten) parts.push(TENS[ten])
    if (one) parts.push(ONES[one])
  }
  return parts.join(' و ')
}

export function numberToPersianWords(value) {
  let numberValue = Math.floor(Math.abs(Number(value || 0)))
  if (!numberValue) return 'صفر'
  const parts = []
  let scale = 0
  while (numberValue > 0 && scale < SCALES.length) {
    const chunk = numberValue % 1000
    if (chunk) parts.unshift(`${threeDigitsToWords(chunk)}${SCALES[scale] ? ` ${SCALES[scale]}` : ''}`)
    numberValue = Math.floor(numberValue / 1000)
    scale += 1
  }
  return parts.join(' و ')
}

export const amountInWords = (value, currency = 'تومان') =>
  value === '' || value === null || value === undefined ? '' : `${numberToPersianWords(value)} ${CURRENCY_SYMBOLS[currency] || currency}`
