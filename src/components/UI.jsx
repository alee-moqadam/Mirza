import { X, Plus, Search, History, ChevronLeft, Inbox } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export function PageHeader({ eyebrow, title, subtitle, onAdd, onHistory, logoSrc, logoAlt }) {
  const { t } = useI18n()
  return <header className="page-header">
    <div className="page-title-wrap">
      {logoSrc && <img className="page-title-logo" src={logoSrc} alt={logoAlt || t(title)} />}
      <div><h1>{t(title)}</h1>{subtitle && <p>{t(subtitle)}</p>}</div>
    </div>
    <div className="header-actions">
      {onHistory && <button className="icon-btn" onClick={onHistory} aria-label={t('تاریخچه')}><History size={20}/></button>}
      {onAdd && <button className="add-btn" onClick={onAdd} aria-label={t('افزودن')}><Plus size={20}/></button>}
    </div>
  </header>
}

export function Modal({ open, title, children, onClose, wide = false }) {
  const { t } = useI18n()
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`modal-sheet ${wide ? 'wide' : ''}`} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div className="grab"/><h2>{t(title)}</h2><button className="icon-btn modal-close" aria-label="بستن" onClick={onClose}><X size={20}/></button></div>
      <div className="modal-body">{children}</div>
    </section>
  </div>
}

export function Field({ label, name, value, onChange, type='text', placeholder, required, multiple }) {
  const { t } = useI18n()
  const props = { name, value: value ?? '', onChange, required, placeholder }
  return <label className="field"><span>{t(label)}{required && <b className="required-mark" aria-hidden="true">*</b>}</span>
    {type === 'textarea' ? <textarea {...props} rows="3"/>
      : <input {...props} type={type} multiple={multiple}/>}
  </label>
}

export function SearchBox({ value, onChange, placeholder='جستجو...' }) {
  const { t } = useI18n()
  return <label className="search"><Search size={18}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={t(placeholder)}/></label>
}

export function Badge({ children, tone }) {
  const { t } = useI18n()
  const badgeTone = tone || (['عقب‌افتاده','برگشت‌خورده','دیرکرد در دریافت'].includes(children) ? 'red' : ['پرداخت شده','دریافت شده','تسویه‌شده'].includes(children) ? 'green' : ['نزدیک سررسید','دریافت ناقص'].includes(children) ? 'amber' : 'slate')
  return <span className={`badge ${badgeTone}`}>{t(children)}</span>
}

export function Segmented({ value, onChange, items }) {
  const { t } = useI18n()
  return <div className="segmented">{items.map(x => <button key={x} className={value===x?'active':''} onClick={()=>onChange(x)}>{t(x)}</button>)}</div>
}

export function Empty({ text='موردی برای نمایش وجود ندارد', title, description, actionLabel, onAction, icon: Icon = Inbox }) {
  const { t } = useI18n()
  return <div className="empty">
    <div className="empty-illustration"><span/><i><Icon size={30}/></i><b/></div>
    <strong>{t(title || text)}</strong>
    <span>{t(description || 'از دکمه افزودن برای ثبت مورد جدید استفاده کنید.')}</span>
    {onAction && <button type="button" className="primary-btn empty-action" onClick={onAction}>{t(actionLabel || 'افزودن')}</button>}
  </div>
}

export function ManageRow({ title, meta, icon, onEdit, onDelete, onOpen }) {
  const { t } = useI18n()
  return <div className="manage-row" onClick={onOpen}><div className="manage-row-title">{icon && <img src={icon} alt="" />}<span><strong>{title}</strong>{meta && <small>{meta}</small>}</span></div><div className="row-actions">
    {onEdit && <button onClick={e=>{e.stopPropagation();onEdit()}}>{t('ویرایش')}</button>}
    {onDelete && <button className="danger-text" onClick={e=>{e.stopPropagation();onDelete()}}>{t('حذف')}</button>}
    {onOpen && <ChevronLeft size={18}/>}
  </div></div>
}

export function FormActions({ onCancel, label='ذخیره اطلاعات' }) {
  const { t } = useI18n()
  return <div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>{t('انصراف')}</button><button className="primary-btn" type="submit">{t(label)}</button></div>
}
