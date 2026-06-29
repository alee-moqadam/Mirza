import { Banknote } from 'lucide-react'
import AmountDisplay from '../AmountDisplay'
import { dateLabel } from '../../helpers/formatters'
import { useI18n } from '../../i18n/I18nContext'

export default function SpecialPayables({ items, currency, onOpen }) {
  const { t } = useI18n()
  if (!items.length) return null
  return <div className="special-list">{items.map(item => <button key={item.id} className="special-card" onClick={() => onOpen(item)}>
    <Banknote /><div><span>{t(item.isCheck ? 'چک پرداختنی' : 'بدهی پرداختنی')}</span><strong>{item.title}</strong><small><AmountDisplay value={item.amount} currency={currency}/> • {t('سررسید')} {dateLabel(item.dueDate)}</small></div>
  </button>)}</div>
}
