const DIGITS = {
  fa: ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'],
  ar: ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'],
}
let activeStyle = 'en'

export const setDigitStyle = style => { activeStyle = style || 'en' }
export const normalizeDigits = value => String(value ?? '')
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

export function localizeDigits(value, style = activeStyle) {
  if (style === 'en') return String(value)
  return String(value).replace(/\d/g, digit => DIGITS[style][Number(digit)])
}
