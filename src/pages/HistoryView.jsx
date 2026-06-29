import { useState } from 'react'
import AmountDisplay from '../components/AmountDisplay'
import RecordDetailSheet from '../components/RecordDetailSheet'
import { Modal, Empty, Badge } from '../components/UI'
import { dateLabel } from '../helpers/formatters'
import { useI18n } from '../i18n/I18nContext'

export default function HistoryView({ open, type, title, histories, currency, onClose, onRestore, onEdit, onDelete }) {
  const { t } = useI18n()
  const [detail, setDetail] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const rows = histories.filter(item => item.entityType === type)
  const selectedCount = selectedIds.length
  const closeSelection = () => { setSelectionMode(false); setSelectedIds([]) }
  const toggleSelection = id => setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const selectAll = () => setSelectedIds(rows.map(item => item.id))
  const deleteSelected = () => {
    if (!selectedIds.length) return
    if (confirm(`${selectedIds.length} مورد برای همیشه حذف شود؟`)) {
      onDelete(selectedIds)
      closeSelection()
    }
  }
  return <Modal open={open} onClose={onClose} title={`${t('تاریخچه')} ${t(title)}`}>
    <div className="history-toolbar">
      {rows.length > 0 && <button type="button" className={selectionMode ? 'secondary-btn' : 'danger-lite'} onClick={() => selectionMode ? closeSelection() : setSelectionMode(true)}>{selectionMode ? 'لغو انتخاب' : 'حذف از آرشیو'}</button>}
      {selectionMode && <span>{selectedCount ? `${selectedCount} مورد انتخاب شده` : 'موردی انتخاب نشده'}</span>}
    </div>
    <div className={`history-list ${selectionMode ? 'selecting' : ''}`}>{rows.length ? rows.map(history => {
      const selected = selectedIds.includes(history.id)
      return <article className={`record-card tappable history-card ${selected ? 'selected' : ''}`} key={history.id} onClick={() => selectionMode ? toggleSelection(history.id) : setDetail(history)}>
        {selectionMode && <button type="button" className={`history-select-dot ${selected ? 'active' : ''}`} aria-label="انتخاب آیتم" onClick={event => { event.stopPropagation(); toggleSelection(history.id) }}>{selected ? '✓' : ''}</button>}
        <div className="card-top"><div><span className="overline">{t('تاریخچه')} {dateLabel(history.createdAt)}</span><h3>{history.item.title || history.item.person}</h3></div><Badge tone="slate">آرشیو</Badge></div>
        <AmountDisplay value={history.item.amount} currency={currency} className="amount"/><p>{history.item.description || t('بدون توضیحات')}</p>
      </article>
    }) : <Empty title="آرشیو خالی است" description="وقتی رکوردی حذف یا آرشیو شود، برای بررسی و بازیابی در اینجا نمایش داده می‌شود."/>}</div>
    {selectionMode && <div className="history-selection-actions">
      <button type="button" className="secondary-btn" onClick={selectedCount === rows.length ? () => setSelectedIds([]) : selectAll}>{selectedCount === rows.length ? 'لغو انتخاب همه' : 'انتخاب همه'}</button>
      {selectedCount > 0 && <button type="button" className="primary-btn danger-btn" onClick={deleteSelected}>حذف برای همیشه</button>}
    </div>}
    <RecordDetailSheet item={detail?.item} type={type} currency={currency} onClose={() => setDetail(null)}
      onEdit={() => { onEdit(detail); setDetail(null) }}
      onDelete={() => { if (confirm('این مورد برای همیشه حذف شود؟')) { onDelete(detail.id); setDetail(null) } }}>
      <button className="detail-secondary-action" onClick={() => { onRestore(detail); setDetail(null) }}>{t('بازگردانی به فهرست فعال')}</button>
    </RecordDetailSheet>
  </Modal>
}
