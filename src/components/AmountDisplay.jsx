import { CURRENCY_SYMBOLS, formatNumber } from '../helpers/formatters'

export default function AmountDisplay({ value, currency = 'تومان', className = '' }) {
  return <span className={`amount-display ${className}`} dir="ltr">
    <small>{CURRENCY_SYMBOLS[currency] || currency}</small>
    <b>{formatNumber(value)}</b>
  </span>
}
