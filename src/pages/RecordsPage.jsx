import { useState } from 'react'
import RecordDetailSheet from '../components/RecordDetailSheet'
import UndoSnackbar from '../components/UndoSnackbar'
import JalaliDateInput from '../components/JalaliDateInput'
import AmountDisplay from '../components/AmountDisplay'
import { BottomSheetSelect, TagPicker } from '../components/FormControls'
import { BankQuickAddModal } from '../components/BankPicker'
import { Empty, Field, FormActions, Modal, PageHeader } from '../components/UI'
import RecordCard from '../components/records/RecordCard'
import RecordForm from '../components/records/RecordForm'
import RecordToolbar from '../components/records/RecordToolbar'
import { useRecords } from '../hooks/useRecords'
import { dateLabel, number } from '../helpers/formatters'
import HistoryView from './HistoryView'
import { RECORD_CONFIG, RECORD_DEFAULTS } from '../constants/records'
import { compareDates, currentJalaliMonthStartIso, inCurrentMonth, isoToJalali } from '../helpers/dates'
import { applyRecordFilters, createDeletedHistoryItem, filterRecordsByTimeTab, isDeletedRecord, prepareRecord } from '../helpers/records'
import { CONTACT_SUGGESTION_SAVE_MODES, applyContactSuggestion, getContactSuggestionFields } from '../helpers/contacts'
import {
  createRecurringDebtParent,
  deleteRecurringOccurrences,
  generateRecurringDebtOccurrences,
  getOccurrenceKey,
  getRecurringDeleteSelectionState,
  getRecurringGroupForRecord,
  isRecurringChild,
  isRecurringParent,
  reconcileRecurringDebtOccurrences,
} from '../helpers/recurrence'
import { getBankIcon } from '../constants/banks'
import { useI18n } from '../i18n/I18nContext'

export default function RecordsPage({ type, data, updateData, initialFilter = 'همه', navigate }) {
  const { t } = useI18n()
  const records = useRecords(type, data, updateData, initialFilter)
  const currency = data.currency || 'تومان'
  const [addMenu, setAddMenu] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({ category: '', bank: '', tags: [], amountFrom: '', amountTo: '', dateFrom: '', dateTo: '' })
  const [contactSuggestion, setContactSuggestion] = useState(null)
  const [timeTab, setTimeTab] = useState('current')
  const [expenseTimeTab, setExpenseTimeTab] = useState('current')
  const [recurringDelete, setRecurringDelete] = useState(null)
  const detailType = type
  const hasTimeTabs = ['debts', 'incomes'].includes(type)
  const hasExpenseTabs = type === 'currentExpenses'
  const timeScopedItems = hasTimeTabs
    ? filterRecordsByTimeTab(records.visibleItems, timeTab, type)
    : hasExpenseTabs
      ? filterExpensesByTimeTab(records.visibleItems, expenseTimeTab)
      : records.visibleItems
  const displayedItems = applyRecordFilters(timeScopedItems, { ...advancedFilters, tagFilter }, type)
  const openAdd = () => ['debts', 'incomes'].includes(type) ? setAddMenu(true) : records.openNew()
  const chooseDebtAdd = isCheck => {
    const today = isoToJalali(new Date())
    const checkbookBank = data.banks?.find(bank => bank.hasCheckbook)?.title || ''
    records.setEditing({
      ...RECORD_DEFAULTS.debts,
      isCheck,
      isLoan: false,
      isPeriodic: false,
      relation: 'پرداختنی',
      dueDate: today,
      endDate: '',
      checkAccountMode: 'card',
      receiverBank: '',
      issuerBank: isCheck ? checkbookBank : '',
      bank: isCheck ? checkbookBank : '',
    })
    setAddMenu(false)
  }
  const chooseIncomeAdd = isCheck => {
    const today = isoToJalali(new Date())
    const monthEnd = isoToJalali(currentJalaliMonthEndIso())
    if (!isCheck) {
      records.setEditing({ ...RECORD_DEFAULTS.incomes, startDate: monthEnd, dueDate: monthEnd, contacts: [] })
      setAddMenu(false)
      return
    }
    const defaultBank = data.banks?.[0]?.title || ''
    records.setEditing({
      ...RECORD_DEFAULTS.debts,
      isCheck: true,
      relation: 'دریافتنی',
      direction: 'receivable',
      incomeType: 'چک دریافتی',
      category: 'چک دریافتی',
      dueDate: today,
      endDate: '',
      status: 'دریافت نشده',
      receivedAmount: 0,
      checkAccountMode: 'card',
      issuerBank: defaultBank,
      bank: defaultBank,
    })
    setAddMenu(false)
  }
  const saveDebt = event => {
    event.preventDefault()
    if (records.editing?.isCheck) {
      const checkItems = normalizedCheckItems(records.editing)
      const required = [records.editing.person, records.editing.amount, records.editing.issuerBank]
      if (records.editing.relation !== 'دریافتنی') required.push(records.editing.title)
      if (required.some(value => !String(value || '').trim()) || !checkItems.length) {
        alert('برای ثبت چک پرداختی، موارد ستاره‌دار باید تکمیل شود.')
        return
      }
    } else if (!String(records.editing?.title || '').trim() || !String(records.editing?.amount || '').trim()) {
      alert('عنوان بدهی و مبلغ را وارد کنید.')
      return
    }
    const item = prepareRecord({ ...records.editing, title: records.editing.title || 'بدهی ثبت‌شده' }, 'debts')
    if (item.isCheck && item.relation === 'دریافتنی') {
      const incomeChecks = buildCheckRecords(item).map(check => ({ ...check, direction: 'receivable', incomeType: 'چک دریافتی', category: 'چک دریافتی', bank: check.issuerBank || check.bank || check.receiverBank, receivedAmount: 0, status: 'دریافت نشده', tags: [...new Set([...(check.tags || []), 'چک دریافتی'])] }))
      updateData(current => ({
        ...current,
        debts: current.debts.filter(record => record.id !== item.id && record.checkGroupId !== item.checkGroupId),
        incomes: [...incomeChecks, ...current.incomes.filter(record => record.id !== item.id && record.checkGroupId !== item.checkGroupId)],
      }))
      records.closeEditor()
      maybeSuggestContact(incomeChecks[0], data.financialContacts || [], setContactSuggestion)
      return
    }
    if (!item.isCheck && item.isPeriodic && item.recurrence !== 'فقط یک‌بار') {
      updateData(current => {
        const parent = createRecurringDebtParent(item)
        const existingOccurrences = (current.debts || []).filter(record =>
          record.recurrenceId === parent.recurrenceId &&
          (record.isGenerated || record.isRecurringChild || record.parentDebtId === parent.id)
        )
        const reconciled = reconcileRecurringDebtOccurrences({ parentDebt: parent, existingOccurrences })
        const nextSeriesIds = new Set(reconciled.records.map(record => record.id))
        return {
          ...current,
          debts: [
            ...reconciled.records,
            ...current.debts.filter(record => {
              const sameSeries = record.recurrenceId === parent.recurrenceId || record.id === parent.id || record.parentDebtId === parent.id
              return !sameSeries && !nextSeriesIds.has(record.id)
            }),
          ],
        }
      })
      records.closeEditor()
      maybeSuggestContact(item, data.financialContacts || [], setContactSuggestion)
      return
    }
    const debtRecords = item.isCheck ? buildCheckRecords(item) : [{ ...item, isRecurringParent: false, isRecurringChild: false }]
    updateData(current => ({
      ...current,
      debts: [
        ...debtRecords,
        ...current.debts.filter(record => item.isCheck
          ? record.id !== item.id && record.checkGroupId !== item.checkGroupId
          : record.id !== item.id),
      ],
    }))
    records.closeEditor()
    maybeSuggestContact(debtRecords[0], data.financialContacts || [], setContactSuggestion)
  }
  const saveIncome = event => {
    event.preventDefault()
    if (records.editing?.isCheck) {
      const checkItems = normalizedCheckItems(records.editing)
      const required = [records.editing.person, records.editing.amount, records.editing.issuerBank]
      if (required.some(value => !String(value || '').trim()) || !checkItems.length) {
        alert('برای ثبت چک دریافتی، موارد ستاره‌دار باید تکمیل شود.')
        return
      }
    } else {
      const required = [records.editing?.title, records.editing?.amount, records.editing?.category]
      if (required.some(value => !String(value || '').trim())) {
        alert('عنوان درآمد، مبلغ کل و دسته‌بندی درآمد الزامی است.')
        return
      }
    }
    const item = prepareRecord(records.editing?.isCheck ? { ...records.editing, title: records.editing.title || `چک دریافتی ${records.editing.person || ''}`.trim() } : records.editing, 'incomes')
    const incomeRecords = item.isCheck ? buildCheckRecords(item).map(check => ({ ...check, direction: 'receivable', incomeType: 'چک دریافتی', category: 'چک دریافتی', bank: check.issuerBank || check.bank || check.receiverBank, receivedAmount: 0, status: check.status || 'دریافت نشده', tags: [...new Set([...(check.tags || []), 'چک دریافتی'])] })) : [item]
    records.setEditing({ ...records.editing, ...item })
    updateData(current => ({
      ...current,
      incomes: [
        ...incomeRecords,
        ...current.incomes.filter(record => item.isCheck
          ? record.id !== item.id && record.checkGroupId !== item.checkGroupId
          : record.id !== item.id),
      ],
    }))
    records.closeEditor()
    maybeSuggestContact(incomeRecords[0], data.financialContacts || [], setContactSuggestion)
  }
  const saveCurrentExpense = event => {
    event.preventDefault()
    const required = [records.editing?.title, records.editing?.amount, records.editing?.expenseDate]
    if (required.some(value => !String(value || '').trim())) {
      alert('عنوان هزینه، مبلغ و تاریخ هزینه الزامی است.')
      return
    }
    records.save(event)
  }
  const openDelete = item => {
    if (type !== 'debts' || (!isRecurringChild(item) && !isRecurringParent(item))) {
      records.remove(item)
      return
    }
    const group = getRecurringGroupForRecord(item, data.debts || [])
    const parent = group.parent || item
    const occurrences = generateRecurringDebtOccurrences({ parentDebt: parent, existingOccurrences: group.children })
      .filter(occurrence => !occurrence.archived && !occurrence.inactive && occurrence.status !== 'لغوشده')
      .sort((a, b) => compareDates(a.dueDate, b.dueDate))
    const targetKey = getOccurrenceKey(item)
    setRecurringDelete({
      item,
      parent,
      occurrences,
      selectedKeys: targetKey ? [targetKey] : occurrences.map(getOccurrenceKey),
    })
  }
  const setDeleteSelection = key => {
    setRecurringDelete(current => {
      if (!current) return current
      const selected = new Set(current.selectedKeys)
      selected.has(key) ? selected.delete(key) : selected.add(key)
      return { ...current, selectedKeys: [...selected] }
    })
  }
  const setAllDeleteSelections = keys => {
    setRecurringDelete(current => current ? { ...current, selectedKeys: keys } : current)
  }
  const applyRecurringDelete = (mode) => {
    if (!recurringDelete) return
    const targetKey = getOccurrenceKey(recurringDelete.item)
    const selection = getRecurringDeleteSelectionState(recurringDelete.selectedKeys, recurringDelete.occurrences.length)
    const occurrenceKeys = mode === 'one' ? [targetKey] : recurringDelete.selectedKeys
    const historyItems = recurringDelete.occurrences.filter(occurrence => occurrenceKeys.includes(getOccurrenceKey(occurrence)))
    updateData(current => ({
      ...current,
      debts: deleteRecurringOccurrences({
        records: current.debts || [],
        targetRecord: recurringDelete.item,
        occurrenceKeys,
        deleteSeries: mode === 'all' || selection.isAllSelected,
      }),
      histories: [
        ...historyItems.map(item => createDeletedHistoryItem('debts', item)),
        ...(current.histories || []),
      ],
    }))
    records.setDetail(null)
    setRecurringDelete(null)
  }

  return <div className="page records-page">
    <PageHeader eyebrow={records.config.eyebrow} title={records.config.title} subtitle={`${number(records.items.length)} مورد ثبت‌شده`} onAdd={openAdd} onHistory={() => navigate?.('trash', type) || records.setHistoryOpen(true)}/>
    {hasTimeTabs && <RecordTimeTabs value={timeTab} onChange={setTimeTab} items={records.visibleItems} type={type}/>}
    {hasExpenseTabs && <ExpenseTimeTabs value={expenseTimeTab} onChange={setExpenseTimeTab} items={records.visibleItems}/>}
    <RecordToolbar type={type} filter={records.filter} filters={records.filters} sort={records.sort} onFilter={records.setFilter} onSort={records.setSort}
      tags={data.tags || []} tagFilter={tagFilter} onTagFilter={setTagFilter} onAdvancedFilters={() => setAdvancedOpen(true)}/>
    {hasExpenseTabs && expenseTimeTab === 'past' && <ExpensePastComposition items={displayedItems} currency={currency}/>}
    <div className="record-list">{displayedItems.length ? displayedItems.map(item => <RecordCard
      key={item.id} item={item} type={type} currency={currency} onOpen={() => records.setDetail(item)} onMark={() => records.markComplete(item)}
    />) : <Empty {...emptyStateForRecords(type)} onAction={openAdd} />}</div>
    <RecordForm type={type} config={records.config} data={data} updateData={updateData} categories={records.categories} editing={records.editing} setEditing={records.setEditing} onSave={type === 'debts' ? saveDebt : type === 'incomes' ? saveIncome : type === 'currentExpenses' ? saveCurrentExpense : records.save} onClose={records.closeEditor} currency={currency}/>
    <RecordDetailSheet
      item={records.detail} type={detailType} currency={currency} onClose={() => records.setDetail(null)}
      onEdit={() => records.openEdit(records.detail)}
      onDelete={() => openDelete(records.detail)}
    >
      {detailType === 'incomes' && <button className="detail-secondary-action" onClick={() => records.openPartialIncome(records.detail)}>{t('ثبت میزان دریافت')}</button>}
      {detailType === 'debts' && records.detail?.isCheck && <button className="detail-secondary-action danger-lite" onClick={() => records.markBounced(records.detail)}>{t('ثبت برگشت چک')}</button>}
    </RecordDetailSheet>
    <Modal open={addMenu} title="افزودن مورد جدید" onClose={() => setAddMenu(false)}>
      <div className="add-action-menu">
        {type === 'debts' && <><button onClick={() => chooseDebtAdd(true)}>افزودن چک پرداختی</button><button onClick={() => chooseDebtAdd(false)}>افزودن بدهی</button></>}
        {type === 'incomes' && <><button onClick={() => chooseIncomeAdd(false)}>افزودن درآمد</button><button onClick={() => chooseIncomeAdd(true)}>افزودن چک دریافتی</button></>}
      </div>
    </Modal>
    <RecurringDeleteDialog state={recurringDelete} currency={currency} onToggle={setDeleteSelection} onSetAll={setAllDeleteSelections} onApply={applyRecurringDelete} onClose={() => setRecurringDelete(null)}/>
    <PartialIncomeModal records={records} currency={currency}/>
    <RecordAdvancedFilters open={advancedOpen} type={type} data={data} updateData={updateData} filters={advancedFilters} setFilters={setAdvancedFilters} onClose={() => setAdvancedOpen(false)}/>
    <ContactSuggestionModal suggestion={contactSuggestion} contacts={data.financialContacts || []} onClose={() => setContactSuggestion(null)} onSave={(mode, targetId) => {
      updateData(current => applyContactSuggestion(current, contactSuggestion, mode, targetId))
      setContactSuggestion(null)
    }}/>
    <HistoryView open={records.historyOpen} type={type} title={records.config.title} histories={data.histories} currency={currency} onClose={() => records.setHistoryOpen(false)} onRestore={records.restoreHistory} onEdit={records.editHistory} onDelete={records.deleteHistory}/>
    <UndoSnackbar pending={records.undo.pending} onUndo={records.undo.undo}/>
  </div>
}

function RecurringDeleteDialog({ state, currency, onToggle, onSetAll, onApply, onClose }) {
  if (!state) return null
  const allKeys = state.occurrences.map(getOccurrenceKey)
  const selection = getRecurringDeleteSelectionState(state.selectedKeys, state.occurrences.length)
  const applySelectionAction = () => onSetAll(selection.isAllSelected ? [] : allKeys)
  const deleteMode = selection.isAllSelected ? 'all' : 'selected'
  return <Modal open={!!state} title="حذف بدهی دوره‌ای" onClose={onClose} wide>
    <div className="recurring-delete-dialog">
      <div className="recurring-delete-summary">
        <div>
          <strong>{state.parent.title || state.item.title}</strong>
          <span><AmountDisplay value={state.parent.amount || state.item.amount} currency={currency}/> • {state.parent.recurrence || state.item.recurrence || 'دوره‌ای'}</span>
        </div>
        <button type="button" className="secondary-btn recurring-select-all" onClick={applySelectionAction}>{selection.topSelectionButtonLabel}</button>
      </div>
      <div className="recurring-delete-options">
        {state.occurrences.map(occurrence => {
          const key = getOccurrenceKey(occurrence)
          const selected = state.selectedKeys.includes(key)
          return <label key={key} className={`recurring-delete-row ${selected ? 'selected' : ''}`}>
            <input type="checkbox" checked={state.selectedKeys.includes(key)} onChange={() => onToggle(key)} />
            <i>{selected ? '✓' : ''}</i>
            <span className="recurring-delete-date">
              <strong>{dateLabel(occurrence.dueDate)}</strong>
              <small>{occurrence.status || 'فعال'} • نوبت {number(Number(occurrence.occurrenceIndex || 0) + 1)}</small>
            </span>
            <span className="recurring-delete-amount"><AmountDisplay value={occurrence.amount} currency={currency}/></span>
          </label>
        })}
      </div>
      <div className="form-actions recurring-delete-actions">
        <button type="button" className="secondary-btn" onClick={onClose}>انصراف</button>
        <button type="button" className="danger-zone" onClick={() => onApply(deleteMode)} disabled={selection.isNoneSelected}>{selection.deleteButtonLabel}</button>
      </div>
    </div>
  </Modal>
}

const emptyStateForRecords = type => {
  if (type === 'debts') return {
    title: 'هنوز بدهی یا چکی ثبت نشده',
    description: 'اولین بدهی یا چک پرداختی را ثبت کنید تا سررسیدها، وضعیت پرداخت و یادآوری‌ها را دنبال کنید.',
    actionLabel: 'ثبت بدهی یا چک',
  }
  if (type === 'incomes') return {
    title: 'هنوز درآمدی ثبت نشده',
    description: 'درآمدها و چک‌های دریافتی را ثبت کنید تا جریان ورودی پول و وضعیت دریافت‌ها مشخص شود.',
    actionLabel: 'ثبت درآمد',
  }
  return {
    title: 'هنوز هزینه‌ای ثبت نشده',
    description: 'اولین هزینه جاری را ثبت کنید تا سابقه خرج‌ها و ترکیب هزینه‌ها ساخته شود.',
    actionLabel: 'ثبت هزینه',
  }
}

const normalizedCheckItems = item => {
  const source = item.checkItems?.length ? item.checkItems : [{ checkNumber: item.checkNumber, dueDate: item.dueDate }]
  return source.filter(check => String(check.checkNumber || '').trim() && String(check.dueDate || '').trim())
}

const buildCheckRecords = item => {
  const groupId = item.checkGroupId || item.id || crypto.randomUUID()
  const checks = item.checkItems?.length ? item.checkItems : [{ id: item.id, checkNumber: item.checkNumber, dueDate: item.dueDate }]
  return checks.map((check, index) => ({
    ...item,
    id: check.recordId || (checks.length === 1 && item.id ? item.id : crypto.randomUUID()),
    checkGroupId: groupId,
    checkItems: [{ ...check, recordId: check.recordId || undefined }],
    checkNumber: check.checkNumber,
    dueDate: check.dueDate,
    title: checks.length > 1 ? `${item.title || 'چک'} - چک ${number(index + 1)}` : item.title,
  }))
}

const filterExpensesByTimeTab = (items, tab) => {
  const monthStart = currentJalaliMonthStartIso()
  return items.filter(item => {
    if (isDeletedRecord(item)) return false
    const date = item.expenseDate || item.dueDate
    if (!date) return tab === 'current'
    return tab === 'past' ? compareDates(date, monthStart) < 0 : inCurrentMonth(date)
  })
}

function RecordTimeTabs({ value, onChange, items, type }) {
  const counts = {
    current: filterRecordsByTimeTab(items, 'current', type).length,
    future: filterRecordsByTimeTab(items, 'future', type).length,
    past: filterRecordsByTimeTab(items, 'past', type).length,
  }
  return <div className="debt-time-tabs record-time-tabs" role="tablist" aria-label="بازه رکوردها">
    <button type="button" role="tab" aria-selected={value === 'current'} className={value === 'current' ? 'active' : ''} onClick={() => onChange('current')}>
      <span>جاری</span><i>{number(counts.current)}</i>
    </button>
    <button type="button" role="tab" aria-selected={value === 'future'} className={value === 'future' ? 'active' : ''} onClick={() => onChange('future')}>
      <span>آتی</span><i>{number(counts.future)}</i>
    </button>
    <button type="button" role="tab" aria-selected={value === 'past'} className={value === 'past' ? 'active' : ''} onClick={() => onChange('past')}>
      <span>گذشته</span><i>{number(counts.past)}</i>
    </button>
  </div>
}

function ExpenseTimeTabs({ value, onChange, items }) {
  const counts = {
    current: filterExpensesByTimeTab(items, 'current').length,
    past: filterExpensesByTimeTab(items, 'past').length,
  }
  return <div className="debt-time-tabs expense-time-tabs" role="tablist" aria-label="بازه هزینه‌ها">
    <button type="button" role="tab" aria-selected={value === 'current'} className={value === 'current' ? 'active' : ''} onClick={() => onChange('current')}>
      <span>جاری</span><i>{number(counts.current)}</i>
    </button>
    <button type="button" role="tab" aria-selected={value === 'past'} className={value === 'past' ? 'active' : ''} onClick={() => onChange('past')}>
      <span>گذشته</span><i>{number(counts.past)}</i>
    </button>
  </div>
}

function ExpensePastComposition({ items, currency }) {
  const groups = Object.entries(items.reduce((result, item) => {
    const category = item.category || 'بدون دسته‌بندی'
    return { ...result, [category]: (result[category] || 0) + Number(item.amount || 0) }
  }, {})).sort((a, b) => b[1] - a[1])
  const total = groups.reduce((sum, [, value]) => sum + value, 0)
  const colors = ['var(--brand)', 'var(--brand2)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-danger)']
  let cursor = 0
  const safeTotal = total || 1
  const gradient = groups.length
    ? groups.map(([, value], index) => {
      const start = cursor
      cursor += value / safeTotal * 100
      return `${colors[index % colors.length]} ${start}% ${cursor}%`
    }).join(', ')
    : 'var(--line) 0 100%'
  return <section className="expense-past-composition">
    <div className="expense-past-chart" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true"/>
    <div className="expense-past-content">
      <span>ترکیب هزینه‌های گذشته</span>
      <strong><AmountDisplay value={total} currency={currency}/></strong>
      <div className="expense-past-legend">
        {groups.slice(0, 4).map(([category, value], index) => <i key={category} style={{ '--dot': colors[index % colors.length] }}>
          <b>{category}</b><small>{Math.round(value / (total || 1) * 100)}٪</small>
        </i>)}
        {!groups.length && <p>برای این بازه هزینه‌ای ثبت نشده است.</p>}
      </div>
    </div>
  </section>
}

function RecordAdvancedFilters({ open, type, data, updateData, filters, setFilters, onClose }) {
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const categories = type === 'currentExpenses'
    ? data.expenseCategories
    : type === 'incomes'
      ? data.incomeCategories
      : [{ id: 'all-debt', title: 'چک پرداختی' }, { id: 'all-debt-2', title: 'بدهی' }]
  const patch = change => setFilters({ ...filters, ...change })
  const clear = () => setFilters({ category: '', bank: '', tags: [], amountFrom: '', amountTo: '', dateFrom: '', dateTo: '' })
  const addBank = bank => {
    updateData(current => current.banks.some(item => item.title === bank.title)
      ? current
      : { ...current, banks: [bank, ...current.banks] })
    patch({ bank: bank.title })
    setBankModalOpen(false)
    setBankOpen(false)
  }
  return <Modal open={open} title="فیلترها" onClose={onClose}>
    <div className="form-grid record-advanced-filters">
      <BottomSheetSelect label="دسته‌بندی" value={filters.category} options={categories.map(item => item.title)} onChange={category => patch({ category })}
        open={categoryOpen} onOpen={() => setCategoryOpen(true)} onClose={() => setCategoryOpen(false)}/>
      <BottomSheetSelect label="نام بانک" value={filters.bank} options={(data.banks || []).map(item => item.title)} onChange={bank => patch({ bank })}
        open={bankOpen} onOpen={() => setBankOpen(true)} onClose={() => setBankOpen(false)}
        headerAction={<button type="button" className="sheet-add-option" onClick={() => setBankModalOpen(true)}>+ افزودن بانک</button>}
        optionIcon={getBankIcon}/>
      <TagPicker label="تگ‌ها" tags={data.tags || []} value={filters.tags || []} onChange={tags => patch({ tags })}/>
      <section className="filter-range-grid">
        <Field label="از مبلغ" type="number" value={filters.amountFrom} onChange={event => patch({ amountFrom: event.target.value })}/>
        <Field label="تا مبلغ" type="number" value={filters.amountTo} onChange={event => patch({ amountTo: event.target.value })}/>
      </section>
      <section className="filter-range-grid">
        <JalaliDateInput label={type === 'currentExpenses' ? 'ماه شروع' : 'از تاریخ'} value={filters.dateFrom} onChange={event => patch({ dateFrom: event.target.value })}/>
        <JalaliDateInput label={type === 'currentExpenses' ? 'ماه پایان' : 'تا تاریخ'} value={filters.dateTo} onChange={event => patch({ dateTo: event.target.value })}/>
      </section>
      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={clear}>پاک کردن</button>
        <button type="button" className="primary-btn" onClick={onClose}>اعمال فیلتر</button>
      </div>
      <Modal open={bankModalOpen} title="افزودن بانک" onClose={() => setBankModalOpen(false)}>
        <BankQuickAddModal banks={data.banks || []} onClose={() => setBankModalOpen(false)} onAdd={addBank}/>
      </Modal>
    </div>
  </Modal>
}

const hasCounterpartyInfo = item => Boolean(item?.mobile || item?.account || item?.iban || item?.card || item?.receiverBank)
const sameValue = (left, right) => String(left || '').trim() && String(left || '').trim() === String(right || '').trim()
const contactAlreadyHasInfo = (contacts = [], suggestion) => contacts.some(contact => {
  const accounts = contact.bankAccounts?.length
    ? contact.bankAccounts
    : [{ bank: contact.bank, account: contact.account, iban: contact.iban, card: contact.card }]
  const sameMobile = suggestion.mobile && sameValue(contact.mobile, suggestion.mobile)
  const sameAccount = accounts.some(account =>
    sameValue(account.card, suggestion.bankAccount?.card) ||
    sameValue(account.iban, suggestion.bankAccount?.iban) ||
    (sameValue(account.account, suggestion.bankAccount?.account) && (!suggestion.bankAccount?.bank || sameValue(account.bank, suggestion.bankAccount.bank)))
  )
  return sameMobile || sameAccount
})
const maybeSuggestContact = (item, contacts, setContactSuggestion) => {
  if (!hasCounterpartyInfo(item)) return
  const title = item.contact || item.contacts?.[0] || item.person || ''
  if (!title && !item.mobile) return
  const suggestion = {
    title: title || 'مخاطب جدید',
    mobile: item.mobile || '',
    nationalId: item.nationalId || '',
    bankAccount: {
      id: item.paymentAccountId || crypto.randomUUID(),
      bank: item.receiverBank || item.bank || '',
      account: item.account || '',
      iban: item.iban || '',
      card: item.card || '',
    },
  }
  if (contactAlreadyHasInfo(contacts, suggestion)) return
  setContactSuggestion(suggestion)
}

function ContactSuggestionModal({ suggestion, contacts, onClose, onSave }) {
  const [saveMode, setSaveMode] = useState(CONTACT_SUGGESTION_SAVE_MODES.updateExisting)
  if (!suggestion) return null
  const sameTitle = contacts.find(contact => contact.title === suggestion.title)
  const selectedMode = sameTitle ? saveMode : CONTACT_SUGGESTION_SAVE_MODES.createNew
  const enteredInfoFields = getContactSuggestionFields(suggestion)
  const canSave = enteredInfoFields.length > 0
  const submit = () => {
    if (!canSave) return
    onSave(selectedMode, selectedMode === CONTACT_SUGGESTION_SAVE_MODES.updateExisting ? sameTitle?.id : '')
  }
  return <Modal open={!!suggestion} title="ذخیره در مخاطبین مالی" onClose={onClose}>
    <div className="contact-suggestion-sheet">
      <div className="contact-name-row">
        <span>مخاطب مالی</span>
        <strong>{suggestion.title}</strong>
      </div>
      <div className="contact-info-list">
        {enteredInfoFields.map(field => <div key={field.label}>
          <span>{field.label}</span>
          <strong>{field.value}</strong>
        </div>)}
        {!enteredInfoFields.length && <p className="contact-save-message">اطلاعات قابل ذخیره‌ای برای این مخاطب وارد نشده است.</p>}
      </div>
      {sameTitle && <div className="contact-save-mode" role="radiogroup" aria-label="روش ذخیره مخاطب">
        <label className={selectedMode === CONTACT_SUGGESTION_SAVE_MODES.updateExisting ? 'active' : ''}>
          <input type="radio" name="contact-save-mode" value={CONTACT_SUGGESTION_SAVE_MODES.updateExisting} checked={selectedMode === CONTACT_SUGGESTION_SAVE_MODES.updateExisting} onChange={() => setSaveMode(CONTACT_SUGGESTION_SAVE_MODES.updateExisting)} />
          <span>به‌روزرسانی اطلاعات مخاطب</span>
        </label>
        <label className={selectedMode === CONTACT_SUGGESTION_SAVE_MODES.createNew ? 'active' : ''}>
          <input type="radio" name="contact-save-mode" value={CONTACT_SUGGESTION_SAVE_MODES.createNew} checked={selectedMode === CONTACT_SUGGESTION_SAVE_MODES.createNew} onChange={() => setSaveMode(CONTACT_SUGGESTION_SAVE_MODES.createNew)} />
          <span>ثبت به عنوان مخاطب جدید</span>
        </label>
      </div>}
      <div className="form-actions contact-suggestion-actions">
        <button type="button" className="secondary-btn" onClick={onClose}>بازگشت</button>
        <button type="button" className="primary-btn" onClick={submit} disabled={!canSave}>ذخیره اطلاعات</button>
      </div>
    </div>
  </Modal>
}

function PartialIncomeModal({ records, currency }) {
  const partial = records.partialItem
  const patchPartial = patch => {
    if (!partial) return
    if (Object.prototype.hasOwnProperty.call(patch, 'receivedAmount')) records.setPartialAmount(patch.receivedAmount)
    records.setPartialItem?.({ ...partial, ...patch })
  }
  return <Modal open={!!records.partialItem} title="ثبت میزان دریافت" onClose={() => records.setPartialItem?.(null)}>
    {records.partialItem && <form onSubmit={records.savePartialIncome} className="form-grid">
      <PartialReceiptControl amount={partial.amount} receivedAmount={records.partialAmount} currency={currency} onChange={patchPartial}/>
      <FormActions onCancel={() => records.setPartialItem?.(null)} label="ثبت میزان دریافت"/>
    </form>}
  </Modal>
}

function PartialReceiptControl({ amount, receivedAmount, currency, onChange }) {
  const total = Number(amount || 0)
  const percent = total > 0 ? Math.min(100, Math.round(Number(receivedAmount || 0) / total * 100)) : 0
  const changePercent = nextPercent => {
    const normalizedPercent = Number(nextPercent)
    const nextAmount = Math.round(total * normalizedPercent / 100)
    onChange({
      receivedAmount: nextAmount,
      status: normalizedPercent >= 100 ? 'دریافت شده' : normalizedPercent > 0 ? 'دریافت ناقص' : 'دریافت نشده',
    })
  }
  return <section className="partial-receipt-control">
    <div className="receipt-progress-content">
      <div className="receipt-summary"><span>میزان دریافت</span><strong>{percent}%</strong></div>
      <input type="range" min="0" max="100" step="1" disabled={!total} value={percent} onChange={event => changePercent(event.target.value)}/>
      <div className="receipt-quick-options">{[0, 25, 50, 75, 100].map(option => <button type="button" key={option} disabled={!total} className={percent === option ? 'active' : ''} onClick={() => changePercent(option)}>{option}%</button>)}</div>
      <p>مبلغ دریافت‌شده: <AmountDisplay value={receivedAmount || 0} currency={currency}/></p>
    </div>
  </section>
}
