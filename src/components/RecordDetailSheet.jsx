import { Pencil, Trash2, X } from 'lucide-react'
import AmountDisplay from './AmountDisplay'
import { Badge } from './UI'
import { totalInstallments } from '../helpers/calculations'
import { dateLabel, formatNumber } from '../helpers/formatters'
import { useI18n } from '../i18n/I18nContext'

const LABELS = {
  title: 'عنوان', person: 'نام فرد', relation: 'نوع رابطه مالی', status: 'وضعیت', dueDate: 'تاریخ سررسید',
  startDate: 'تاریخ شروع', endDate: 'تاریخ پایان', category: 'دسته‌بندی', tags: 'تگ‌ها', contact: 'مخاطب مالی', contacts: 'مخاطبین مالی',
  bank: 'نام بانک', receiverBank: 'نام بانک گیرنده', issuerBank: 'بانک دسته چک', checkNumber: 'شماره چک', checkItems: 'چک‌ها', description: 'توضیحات', recurrence: 'دوره تکرار',
  certainty: 'وضعیت قطعیت', incomeType: 'نوع درآمد', createdAt: 'تاریخ ایجاد', updatedAt: 'آخرین ویرایش',
  nationalId: 'کد ملی', mobile: 'شماره موبایل طرف', account: 'شماره حساب', iban: 'شماره شبا', card: 'شماره کارت',
}
const DATE_FIELDS = ['dueDate', 'startDate', 'endDate', 'createdAt', 'updatedAt']
const HIDDEN = ['id', 'amount', 'receivedAmount', 'paidCount', 'totalCount', 'tagsText', 'endless', 'isCheck', 'checkAccountMode']
const formatDetailValue = (key, value, t) => {
  if (key === 'checkItems' && Array.isArray(value)) return value.map((item, index) => `چک ${formatNumber(index + 1)}: ${item.checkNumber} • ${dateLabel(item.dueDate)}`).join('، ')
  if (DATE_FIELDS.includes(key)) return dateLabel(value)
  if (Array.isArray(value)) return value.map(t).join('، ')
  return t(String(value))
}

export default function RecordDetailSheet({ item, type, currency, onClose, onEdit, onDelete, children }) {
  const { t } = useI18n()
  if (!item) return null
  const progress = type === 'debts'
    ? `${formatNumber(item.paidCount || 0)} از ${formatNumber(totalInstallments(item))} نوبت پرداخت شده`
    : type === 'incomes'
      ? `${formatNumber(item.receivedAmount || 0)} از ${formatNumber(item.amount)} دریافت شده`
      : null

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal-sheet detail-sheet" onMouseDown={event => event.stopPropagation()}>
      <header className="detail-head">
        <button className="detail-close" aria-label="بستن" onClick={onClose}><X size={18}/></button>
        <div>
          {onEdit && <button onClick={onEdit}><Pencil size={16}/> {t('ویرایش')}</button>}
          {onDelete && <button className="danger-detail" onClick={onDelete}><Trash2 size={16}/> {t('حذف')}</button>}
        </div>
      </header>
      <div className="modal-body">
        <div className="detail-hero">
          <div><span>{t(item.isCheck ? (item.relation === 'دریافتنی' || item.direction === 'receivable' ? 'چک دریافتی' : 'چک پرداختی') : type === 'debts' ? 'بدهی' : item.category || 'جزئیات رکورد')}</span><h2>{item.title || item.person}</h2></div>
          <Badge>{item.status || 'فعال'}</Badge>
          <AmountDisplay value={item.amount} currency={currency}/>
          {type === 'incomes' && <p>دریافت‌شده: <AmountDisplay value={item.receivedAmount} currency={currency}/></p>}
          {progress && <p>{progress}</p>}
        </div>
        <div className="detail-list">
          {Object.entries(item).filter(([key, value]) => !HIDDEN.includes(key) && value !== '' && value !== null && value !== undefined && LABELS[key]).map(([key, value]) =>
            <div key={key}><span>{t(LABELS[key])}</span><strong>{formatDetailValue(key, value, t)}</strong></div>
          )}
        </div>
      </div>
      {children && <div className="detail-footer-actions">{children}</div>}
    </section>
  </div>
}
