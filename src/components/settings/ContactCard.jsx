import { Copy, Eye } from 'lucide-react'
import { Badge } from '../UI'
import { BankName } from '../BankPicker'
import { maskSensitive } from '../../helpers/contacts'

export default function ContactCard({ contact, onDetail, onEdit, onDelete }) {
  const accounts = contact.bankAccounts?.length ? contact.bankAccounts : [{ bank: contact.bank, card: contact.card, iban: contact.iban, account: contact.account }]
  const primary = accounts[0] || {}
  return <article className="contact-card">
    <div className="avatar">{contact.title.slice(0, 1)}</div>
    <div className="contact-main">
      <div><h3>{contact.title}</h3><Badge>{contact.type}</Badge></div>
      <small>{primary.bank ? <BankName title={primary.bank} neutral/> : 'بانک ثبت نشده'}{accounts.length > 1 ? ` • ${accounts.length} حساب بانکی` : ''}</small>
      <SensitiveValue value={primary.card} masked={maskSensitive(primary.card)} />
      <SensitiveValue value={primary.iban} masked={maskSensitive(primary.iban, 'iban')} />
      <div className="card-actions">
        <button onClick={onDetail}><Eye size={15} /> نمایش کامل</button><button onClick={onEdit}>ویرایش</button>
        <button className="danger-text" onClick={onDelete}>حذف</button>
      </div>
    </div>
  </article>
}

function SensitiveValue({ value, masked }) {
  return <span>{masked} <button onClick={() => navigator.clipboard?.writeText(value)}><Copy size={14} /></button></span>
}
