import { Check, ChevronDown, Tags, UsersRound } from 'lucide-react'
import AmountDisplay from './AmountDisplay'
import { Modal } from './UI'
import { useI18n } from '../i18n/I18nContext'

export function BottomSheetSelect({ label, value, options, onChange, open, onOpen, onClose, headerAction, optionAction, optionIcon, required = false }) {
  const { t } = useI18n()
  return <div className="field mobile-select-field">
    <span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span>
    <button type="button" className="mobile-select-trigger" onClick={onOpen}>
      <strong>{optionIcon?.(value) && <img className="bank-option-icon" src={optionIcon(value)} alt="" />}{t(value || 'انتخاب کنید')}</strong>
      <ChevronDown size={17}/>
    </button>
    <Modal open={open} title={label} onClose={onClose}>
      <div className="sheet-option-list">
        {headerAction}
        {options.map(option => <div key={option} className="sheet-option-row">
          <button type="button" className={value === option ? 'active' : ''} onClick={() => { onChange(option); onClose() }}>
            <span>{optionIcon?.(option) && <img className="bank-option-icon" src={optionIcon(option)} alt="" />}{t(option)}</span>
            {value === option && <Check size={17}/>}
          </button>
          {optionAction?.(option)}
        </div>)}
      </div>
    </Modal>
  </div>
}

export function SingleChoice({ label, value, options, onChange, optionLabels = {}, required = false }) {
  const { t } = useI18n()
  return <div className="field single-choice-field"><span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span><div className="single-choice-options">{options.map(option => <button type="button" key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{t(optionLabels[option] || option)}{value === option && <Check size={14}/>}</button>)}</div></div>
}

export function ContactTagPicker({ label, contacts, value = [], onChange, required = false }) {
  const { t } = useI18n()
  const toggle = title => onChange(value.includes(title) ? value.filter(item => item !== title) : [...value, title])
  return <div className="field contact-picker"><span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span><div className="contact-tag-options">{contacts.map(contact => <button type="button" key={contact.id} className={value.includes(contact.title) ? 'active' : ''} onClick={() => toggle(contact.title)}><UsersRound size={14}/>{contact.title}{value.includes(contact.title) && <Check size={13}/>}</button>)}</div><small className="field-hint">{value.length ? `${value.length} مخاطب انتخاب شده` : 'می‌توانید یک یا چند مخاطب را انتخاب کنید.'}</small></div>
}

export function TagPicker({ label, tags, value = [], onChange, required = false }) {
  const { t } = useI18n()
  const toggle = title => onChange(value.includes(title) ? value.filter(item => item !== title) : [...value, title])
  return <div className="field tag-picker"><span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span><div className="contact-tag-options">{tags.map(tag => <button type="button" key={tag.id} className={value.includes(tag.title) ? 'active' : ''} onClick={() => toggle(tag.title)}><Tags size={14}/>{t(tag.title)}{value.includes(tag.title) && <Check size={13}/>}</button>)}</div></div>
}

export function ReceiptProgress({ amount, receivedAmount, status, currency, onChange }) {
  const { t } = useI18n()
  const total = Number(amount || 0)
  const active = Number(receivedAmount || 0) > 0 || ['دریافت شده', 'دریافت ناقص'].includes(status)
  const percent = total > 0 ? Math.min(100, Math.round(Number(receivedAmount || 0) / total * 100)) : 0
  const toggle = checked => onChange({
    receivedAmount: checked ? total : 0,
    status: checked ? 'دریافت شده' : 'دریافت نشده',
  })
  const changePercent = nextPercent => {
    const nextAmount = Math.round(total * Number(nextPercent) / 100)
    onChange({ receivedAmount: nextAmount, status: Number(nextPercent) >= 100 ? 'دریافت شده' : Number(nextPercent) > 0 ? 'دریافت ناقص' : 'دریافت نشده' })
  }
  return <section className="soft-form-group receipt-group">
    <label className="inline-toggle"><span><strong>{t('وضعیت دریافت')}</strong><small>{active ? t('دریافت شده') : t('دریافت نشده')}</small></span><input type="checkbox" checked={active} onChange={event => toggle(event.target.checked)}/><i/></label>
    <div className={`receipt-progress-content ${active ? '' : 'disabled'}`}>
      <div className="receipt-summary"><span>{t('درصد دریافت‌شده')}</span><strong>{percent}%</strong></div>
      <input type="range" min="0" max="100" step="1" disabled={!active || !total} value={percent} onChange={event => changePercent(event.target.value)}/>
      <div className="receipt-quick-options">{[25, 50, 75, 100].map(option => <button type="button" key={option} disabled={!active || !total} className={percent === option ? 'active' : ''} onClick={() => changePercent(option)}>{option}%</button>)}</div>
      <p>{t('مبلغ دریافت‌شده')}: <AmountDisplay value={receivedAmount || 0} currency={currency}/></p>
    </div>
  </section>
}
