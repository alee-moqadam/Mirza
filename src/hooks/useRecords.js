import { useMemo, useState } from 'react'
import { RECORD_CONFIG, RECORD_DEFAULTS } from '../constants/records'
import { currentJalaliMonthEndIso, isoToJalali, nextDueDate } from '../helpers/dates'
import { currentMonthPayables, filterAndSortRecords, prepareRecord, recordCompletionPatch } from '../helpers/records'
import { deriveDebtListRecords } from '../helpers/recurrence.js'
import { useUndoAction } from './useUndoAction'

const DATE_FIELDS = ['startDate', 'endDate', 'dueDate', 'expenseDate', 'loanStartDate']
const toEditorItem = item => {
  const converted = DATE_FIELDS.reduce((result, field) => ({
  ...result,
  [field]: item[field] ? isoToJalali(item[field]) : '',
  }), { ...item, contacts: item.contacts || (item.contact ? [item.contact] : []), tagsText: (item.tags || []).join(', ') })
  return typeSafeEditorItem(converted)
}

const typeSafeEditorItem = item => ({
  ...item,
  isPeriodic: Boolean(item.isPeriodic || (item.recurrence && item.recurrence !== 'فقط یک‌بار') || item.loanStartDate || item.endDate || item.endless),
  checkItems: item.isCheck
    ? (item.checkItems?.length ? item.checkItems : [{ id: 'primary-check', checkNumber: item.checkNumber || '', dueDate: item.dueDate || '' }]).map(check => ({
      ...check,
      dueDate: check.dueDate ? isoToJalali(check.dueDate) : '',
    }))
    : item.checkItems,
})

export function useRecords(type, data, updateData, initialFilter = 'همه') {
  const config = RECORD_CONFIG[type]
  const items = data[type]
  const categories = type === 'currentExpenses' ? data.expenseCategories : type === 'incomes' ? data.incomeCategories : []
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [partialItem, setPartialItem] = useState(null)
  const [partialAmount, setPartialAmount] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [filter, setFilter] = useState(initialFilter)
  const [sort, setSort] = useState(type === 'currentExpenses' ? 'expenseDate' : 'dueDate')
  const undo = useUndoAction()

  const filters = type === 'currentExpenses' ? [...config.filters, ...categories.map(item => item.title)] : config.filters
  const displayItems = useMemo(() => type === 'debts' ? deriveDebtListRecords(items) : items, [items, type])
  const visibleItems = useMemo(() => filterAndSortRecords(displayItems, filter, sort), [displayItems, filter, sort])
  const specialItems = []

  const openNew = () => {
    const today = isoToJalali(new Date())
    const incomeDate = isoToJalali(currentJalaliMonthEndIso())
    setEditing({
      ...RECORD_DEFAULTS[type],
      startDate: type === 'incomes' ? incomeDate : today,
      dueDate: type === 'incomes' ? incomeDate : today,
      expenseDate: today,
      contacts: [],
    })
  }
  const openEdit = item => { setDetail(null); setEditing(toEditorItem(item)) }
  const closeEditor = () => setEditing(null)

  const save = event => {
    event.preventDefault()
    const item = prepareRecord(editing, type)
    updateData(current => ({
      ...current,
      [type]: current[type].some(record => record.id === item.id)
        ? current[type].map(record => record.id === item.id ? item : record)
        : [item, ...current[type]],
    }))
    closeEditor()
  }

  const remove = item => {
    if (!confirm('این مورد به تاریخچه منتقل شود؟')) return
    updateData(current => ({
      ...current,
      [type]: current[type].filter(record => record.id !== item.id),
      histories: [{ id: crypto.randomUUID(), entityType: type, item, createdAt: new Date().toISOString() }, ...current.histories],
    }))
    setDetail(null)
  }

  const markComplete = item => {
    const action = type === 'incomes' || item.relation === 'دریافتنی' ? 'دریافت' : 'تسویه'
    undo.schedule(`${action} ثبت شد`, () => updateData(current => {
      const completed = { ...item, ...recordCompletionPatch(type, item), updatedAt: new Date().toISOString() }
      if (item.isGenerated && type === 'debts') {
        const existing = current[type].some(record => record.id === item.id || record.recurrenceKey === item.recurrenceKey)
        return {
          ...current,
          [type]: existing
            ? current[type].map(record => record.id === item.id || record.recurrenceKey === item.recurrenceKey ? completed : record)
            : [completed, ...current[type]],
          histories: [{ id: crypto.randomUUID(), entityType: type, item: completed, createdAt: new Date().toISOString() }, ...current.histories],
        }
      }
      const nextDue = ['debts', 'incomes'].includes(type) && item.recurrence !== 'فقط یک‌بار' ? nextDueDate(item) : ''
      const canCreateNextCycle = nextDue && (item.endless || !item.endDate || new Date(nextDue) <= new Date(item.endDate))
      const nextCycle = canCreateNextCycle
        ? [{ ...item, id: crypto.randomUUID(), dueDate: nextDue, status: type === 'incomes' ? 'دریافت نشده' : 'فعال', receivedAmount: type === 'incomes' ? 0 : item.receivedAmount, parentId: item.parentId || item.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
        : []
      return {
        ...current,
        [type]: [...nextCycle, ...current[type].filter(record => record.id !== item.id)],
        histories: [{ id: crypto.randomUUID(), entityType: type, item: completed, createdAt: new Date().toISOString() }, ...current.histories],
      }
    }))
    setDetail(null)
  }

  const openPartialIncome = item => {
    setDetail(null)
    setPartialItem(item)
    setPartialAmount(item.receivedAmount || '')
  }

  const savePartialIncome = event => {
    event.preventDefault()
    const receivedAmount = Math.min(Number(partialItem.amount), Number(partialAmount || 0))
    updateData(current => ({
      ...current,
      incomes: current.incomes.map(record => record.id === partialItem.id
        ? { ...record, receivedAmount, status: receivedAmount >= record.amount ? 'دریافت شده' : 'دریافت ناقص', updatedAt: new Date().toISOString() }
        : record),
    }))
    setPartialItem(null)
  }

  const markBounced = item => {
    updateData(current => ({
      ...current,
      debts: current.debts.map(record => record.id === item.id ? { ...record, status: 'برگشت‌خورده', updatedAt: new Date().toISOString() } : record),
    }))
    setDetail(null)
  }

  const restoreHistory = history => updateData(current => ({
    ...current,
    [type]: [history.item, ...current[type]],
    histories: current.histories.filter(item => item.id !== history.id),
  }))

  const editHistory = history => {
    restoreHistory(history)
    setHistoryOpen(false)
    setEditing(toEditorItem(history.item))
  }

  const deleteHistory = id => updateData(current => ({
    ...current,
    histories: current.histories.filter(item => Array.isArray(id) ? !id.includes(item.id) : item.id !== id),
  }))

  return {
    config, items, categories, editing, setEditing, detail, setDetail, partialItem, setPartialItem, partialAmount, setPartialAmount,
    historyOpen, setHistoryOpen, filter, setFilter, sort, setSort, filters, visibleItems, specialItems, undo,
    openNew, openEdit, closeEditor, save, remove, markComplete, openPartialIncome, savePartialIncome,
    markBounced, restoreHistory, editHistory, deleteHistory,
  }
}
