import { amountInWords, formatNumber, parseFormattedNumber } from '../helpers/formatters'
import { normalizeDigits } from '../utils/numberFormat'
import { useI18n } from '../i18n/I18nContext'

export default function AmountInput({ label, value, onChange, currency, required = false }) {
  const { t } = useI18n()
  const raw = value === '' || value === undefined ? '' : value
  const handleChange = event => {
    const clean = normalizeDigits(event.target.value).replace(/[^\d]/g, '')
    onChange({ target: { value: clean === '' ? '' : parseFormattedNumber(clean) } })
  }
  return <label className="field amount-field">
    <span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span>
    <div className="amount-input-wrap"><input inputMode="numeric" required={required} value={raw === '' ? '' : formatNumber(raw)} onChange={handleChange}/><i>{currency}</i></div>
    {raw !== '' && <small className="amount-words">«{amountInWords(raw, currency)}»</small>}
  </label>
}
