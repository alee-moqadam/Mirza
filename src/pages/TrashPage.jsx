import { useState } from 'react'
import { ArrowRight, Check, Trash2 } from 'lucide-react'
import AmountDisplay from '../components/AmountDisplay'
import { Badge, Empty } from '../components/UI'
import {
  cleanRestoredRecord,
  getDeletedRecordKey,
  getDeletedRecordsByType,
  getTrashSelectionState,
  groupDeletedRecordsByDeletedDate,
  isDeletedHistoryItem,
} from '../helpers/records'
import { restoreRecurringOccurrence, isRecurringChild } from '../helpers/recurrence'
import { dateLabel, number } from '../helpers/formatters'

const TYPE_LABELS = {
  debts: 'بدهی‌ها',
  incomes: 'درآمدها',
  currentExpenses: 'هزینه‌ها',
  expenses: 'هزینه‌ها',
  financialContacts: 'مخاطبین مالی',
  banks: 'بانک‌ها',
  tags: 'تگ‌ها',
  expenseCategories: 'دسته‌بندی هزینه',
  incomeCategories: 'دسته‌بندی درآمد',
}

const TRASH_TYPES = ['all', 'debts', 'incomes', 'currentExpenses', 'financialContacts']

export default function TrashPage({ data, updateData, initialType = 'all', onBack }) {
  const [filter, setFilter] = useState(initialType || 'all')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState([])
  const histories = (data.histories || []).filter(isDeletedHistoryItem)
  const grouped = getDeletedRecordsByType(histories)
  const rows = histories
    .filter(item => filter === 'all' || (item.deletedFromType || item.entityType) === filter)
    .sort((a, b) => String(b.deletedAt || b.createdAt || '').localeCompare(String(a.deletedAt || a.createdAt || '')))
  const visibleKeys = rows.map(getDeletedRecordKey).filter(Boolean)
  const selectedVisibleKeys = selectedKeys.filter(key => visibleKeys.includes(key))
  const selection = getTrashSelectionState(selectedVisibleKeys, visibleKeys.length)
  const timelineGroups = groupDeletedRecordsByDeletedDate(rows)
  const closeSelection = () => {
    setSelectionMode(false)
    setSelectedKeys([])
  }
  const handleBack = () => selectionMode ? closeSelection() : onBack?.()
  const toggleSelection = key => {
    if (!selectionMode || !key) return
    setSelectedKeys(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])
  }
  const applySelectAll = () => setSelectedKeys(selection.isAllSelected ? [] : visibleKeys)
  const restoreHistoryToData = (current, history) => {
    const type = history.deletedFromType || history.entityType
    const restoredItem = cleanRestoredRecord(history.item)
    const currentRows = current[type] || []
    const nextRows = type === 'debts' && isRecurringChild(restoredItem)
      ? restoreRecurringOccurrence({ records: currentRows, targetRecord: restoredItem })
      : currentRows.some(item => item.id === restoredItem.id)
        ? currentRows.map(item => item.id === restoredItem.id ? restoredItem : item)
        : [restoredItem, ...currentRows]
    return { ...current, [type]: nextRows }
  }
  const restoreSelected = () => {
    if (!selectedVisibleKeys.length) return
    updateData(current => {
      const selected = new Set(selectedVisibleKeys)
      const selectedHistories = (current.histories || []).filter(history => selected.has(getDeletedRecordKey(history)))
      const restoredData = selectedHistories.reduce(restoreHistoryToData, current)
      return {
        ...restoredData,
        histories: (restoredData.histories || []).filter(history => !selected.has(getDeletedRecordKey(history))),
      }
    })
    closeSelection()
  }
  const permanentlyDeleteSelected = () => {
    if (!selectedVisibleKeys.length) return
    if (!confirm(`${number(selectedVisibleKeys.length)} مورد انتخاب‌شده برای همیشه حذف شود؟`)) return
    const selected = new Set(selectedVisibleKeys)
    updateData(current => ({
      ...current,
      histories: (current.histories || []).filter(history => !selected.has(getDeletedRecordKey(history))),
    }))
    closeSelection()
  }

  return <div className="page trash-page">
    <header className="page-header trash-topbar">
      <div className="trash-title-group">
        <button type="button" className="icon-btn trash-back-btn" onClick={handleBack} aria-label="بازگشت"><ArrowRight size={20}/></button>
        <div><h1>موارد حذف‌شده</h1><p>{number(rows.length)} مورد حذف‌شده</p></div>
      </div>
      <button type="button" className="icon-btn trash-manage-btn" disabled={!rows.length} onClick={() => selectionMode ? closeSelection() : setSelectionMode(true)} aria-label={selectionMode ? 'انصراف' : 'انتخاب'}>
        {selectionMode ? 'انصراف' : 'انتخاب'}
      </button>
    </header>
    <div className="trash-filter-tabs" role="tablist" aria-label="فیلتر موارد حذف‌شده">
      {TRASH_TYPES.map(type => <button key={type} type="button" className={filter === type ? 'active' : ''} onClick={() => setFilter(type)}>
        <span>{type === 'all' ? 'همه' : TYPE_LABELS[type] || type}</span>
        <i>{number(type === 'all' ? histories.length : (grouped[type] || []).length)}</i>
      </button>)}
    </div>
    {selectionMode && rows.length > 0 && <div className="trash-selection-bar">
      <button type="button" className="secondary-btn" onClick={applySelectAll}>{selection.selectionActionLabel}</button>
      <span>{selection.selectedCount ? `${number(selection.selectedCount)} مورد انتخاب شده` : 'موردی انتخاب نشده'}</span>
    </div>}
    <div className="trash-list">
      {rows.length ? timelineGroups.map(group => <section className="trash-date-group" key={group.key}>
        <h2>{group.label}</h2>
        <div>{group.items.map(history => {
          const key = getDeletedRecordKey(history)
          return <TrashCard key={key} history={history} currency={data.currency || 'تومان'} selectionMode={selectionMode} selected={selectedVisibleKeys.includes(key)} onToggle={() => toggleSelection(key)} />
        })}</div>
      </section>) : <Empty title="مورد حذف‌شده‌ای وجود ندارد" description="رکوردهایی که حذف می‌کنید اینجا نمایش داده می‌شوند و از گزارش‌های عادی جدا هستند."/>}
    </div>
    {selectionMode && rows.length > 0 && <div className="trash-bulk-actions">
      <button type="button" className="secondary-btn" onClick={closeSelection}>انصراف</button>
      <button type="button" className="secondary-btn" disabled={selection.isNoneSelected} onClick={restoreSelected}>بازیابی</button>
      <button type="button" className="danger-zone" disabled={selection.isNoneSelected} onClick={permanentlyDeleteSelected}>حذف دائمی</button>
    </div>}
  </div>
}

function TrashCard({ history, currency, selectionMode, selected, onToggle }) {
  const item = history.item || {}
  const type = history.deletedFromType || history.entityType
  const date = item.dueDate || item.expenseDate || item.startDate || item.createdAt
  return <article className={`trash-card ${selectionMode ? 'selectable' : ''} ${selected ? 'selected' : ''}`} onClick={selectionMode ? onToggle : undefined}>
    {selectionMode && <span className={`trash-select-indicator ${selected ? 'active' : ''}`}>{selected ? <Check size={14}/> : ''}</span>}
    <div className="trash-card-head">
      <div>
        <span>{TYPE_LABELS[type] || type}</span>
        <h3>{item.title || item.person || item.name || 'مورد حذف‌شده'}</h3>
      </div>
      <Badge tone="red">حذف‌شده</Badge>
    </div>
    <div className="trash-card-meta">
      {item.amount !== undefined && <span><b>مبلغ</b><AmountDisplay value={item.amount} currency={currency} /></span>}
      {date && <span><b>تاریخ اصلی</b>{dateLabel(date)}</span>}
      {(item.previousStatus || item.status) && <span><b>وضعیت قبلی</b>{item.previousStatus || item.status}</span>}
    </div>
  </article>
}
