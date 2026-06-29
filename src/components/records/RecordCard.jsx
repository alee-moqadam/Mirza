import { Building2, CalendarDays, Check, RotateCcw } from 'lucide-react'
import { Badge } from '../UI'
import AmountDisplay from '../AmountDisplay'
import { BankName } from '../BankPicker'
import { totalInstallments } from '../../helpers/calculations'
import { dynamicStatus, isOverdue } from '../../helpers/dates'
import { dateLabel, number } from '../../helpers/formatters'
import { useI18n } from '../../i18n/I18nContext'

export default function RecordCard({ item, type, currency, onOpen, onMark }) {
  const { t } = useI18n()
  const status = dynamicStatus(item)
  const remaining = Number(item.amount) - Number(item.receivedAmount || 0)
  const total = totalInstallments(item)

  const actionLabel = type === 'incomes' || item.relation === 'دریافتنی' ? 'دریافت شد' : 'تسویه شد'
  const incomePercent = item.amount ? Math.min(100, Number(item.receivedAmount || 0) / Number(item.amount) * 100) : 0
  const shownDate = item.expenseDate || item.dueDate
  const shownBank = item.issuerBank || item.bank || item.receiverBank
  return <article className={`record-card tappable ${isOverdue(item) ? 'overdue' : ''} ${item.status === 'برگشت‌خورده' ? 'bounced' : ''} ${item.isCheck ? 'check-card' : ''}`} onClick={onOpen}>
    <div className="card-top">
      <div><span className="overline">{t(item.isCheck ? (item.relation === 'دریافتنی' || item.direction === 'receivable' ? 'چک دریافتی' : 'چک پرداختی') : type === 'debts' ? 'بدهی' : (item.category || 'بدون دسته‌بندی'))}</span><h3>{item.title}</h3></div>
      <Badge>{status}</Badge>
    </div>
    <div className={type === 'incomes' ? 'income-amount-row' : ''}>{type === 'incomes' && <span className="mini-donut" style={{ '--percent': `${incomePercent * 3.6}deg` }}/>}<AmountDisplay value={item.amount} currency={currency} className="amount"/></div>
    <div className="card-meta">
      <span><CalendarDays size={15} /> {t(type === 'currentExpenses' ? 'تاریخ هزینه' : 'سررسید')} {dateLabel(shownDate)}</span>
      {item.isCheck && shownBank && <span><Building2 size={15}/><BankName title={shownBank} neutral/></span>}
      {item.recurrence && <span><RotateCcw size={15} /> {t(item.recurrence)}</span>}
    </div>
    {type === 'debts' && !item.isCheck && <>
      <div className="progress"><i className="amber" style={{ width: `${Math.min(100, (item.paidCount || 0) / total * 100)}%` }} /></div>
      <p>{number(item.paidCount || 0)} از {number(total)} نوبت پرداخت شده • پرداخت بعدی {dateLabel(item.dueDate)}</p>
    </>}
    {type === 'incomes' && <>
      <p>وضعیت دریافت: {t(item.status || 'دریافت نشده')} • <AmountDisplay value={item.receivedAmount} currency={currency}/> از <AmountDisplay value={item.amount} currency={currency}/> دریافت شده • مانده <AmountDisplay value={remaining} currency={currency}/></p>
      {item.tags?.length > 0 && <div className="tags">{item.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>}
    </>}
    {type === 'debts' && <p>{item.relation} برای {item.person}{shownBank ? <> • <BankName title={shownBank} neutral/></> : ''}</p>}
    {type !== 'currentExpenses' && <div className="card-main-action"><button onClick={event => { event.stopPropagation(); onMark() }}><Check size={17}/>{t(actionLabel)}</button></div>}
  </article>
}
