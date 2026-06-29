import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { localizeDigits } from '../utils/numberFormat'
import { useI18n } from '../i18n/I18nContext'
import JalaliWheelPicker from './JalaliWheelPicker'

export default function JalaliDateInput({ label, value, onChange, disabled = false, required = false }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return <div className={`field ${disabled ? 'disabled-field' : ''}`}>
    <span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span>
    <button type="button" className="date-input-wrap" disabled={disabled} onClick={() => setOpen(true)}>
      <strong>{disabled ? t('بدون تاریخ پایان') : localizeDigits(value || 'انتخاب تاریخ')}</strong>
      <CalendarDays size={18}/>
    </button>
    <JalaliWheelPicker open={open} title={label} value={value} onChange={nextValue => onChange({ target: { value: nextValue } })} onClose={() => setOpen(false)}/>
  </div>
}
