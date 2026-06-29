import { useState } from 'react'
import { ArrowUpDown, Check, SlidersHorizontal } from 'lucide-react'
import { Modal } from '../UI'
import { useI18n } from '../../i18n/I18nContext'

export default function RecordToolbar({ type, filter, filters, sort, onFilter, onSort, tags = [], tagFilter = '', onTagFilter, onAdvancedFilters }) {
  const { t } = useI18n()
  const [sortOpen, setSortOpen] = useState(false)
  const options = [
    [type === 'currentExpenses' ? 'expenseDate' : 'dueDate', type === 'currentExpenses' ? 'تاریخ هزینه' : 'تاریخ سررسید'],
    ['amount', 'مبلغ'],
    ...(type !== 'debts' ? [['category', 'دسته‌بندی']] : []),
    ['contact', 'مخاطب مالی'],
    ['status', 'وضعیت'],
  ]
  return <div className="record-filter-row">
    <button type="button" className="filter-chip control-chip" onClick={() => setSortOpen(true)}><ArrowUpDown size={14}/>{t('مرتب‌سازی')}</button>
    <button type="button" className="filter-chip control-chip dark-chip" onClick={onAdvancedFilters}><SlidersHorizontal size={14}/>{t('فیلترها')}</button>
    {filters.filter(item => item !== 'همه').map(item => <button type="button" key={item} className={`filter-chip ${filter === item ? 'active' : ''}`} onClick={() => onFilter(filter === item ? 'همه' : item)}>{t(item)}</button>)}
    {tags.map(item => item.title).map(tag => <button type="button" key={tag} className={`filter-chip tag-chip ${tagFilter === tag ? 'active' : ''}`} onClick={() => onTagFilter(tagFilter === tag ? '' : tag)}>{tag}</button>)}
    <Modal open={sortOpen} title="مرتب‌سازی" onClose={() => setSortOpen(false)}>
      <div className="sheet-option-list sort-sheet-options">{options.map(([value, label]) => <button type="button" key={value} className={sort === value ? 'active' : ''} onClick={() => { onSort(value); setSortOpen(false) }}><span>{t(label)}</span>{sort === value && <Check size={17}/>}</button>)}</div>
    </Modal>
  </div>
}
