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
import { number } from '../helpers/formatters'
import HistoryView from './HistoryView'
import { RECORD_CONFIG, RECORD_DEFAULTS } from '../constants/records'
import { compareDates, currentJalaliMonthEndIso, currentJalaliMonthStartIso, inCurrentMonth, isoToJalali, jalaliMonthEndIso, jalaliMonthStartIso, jalaliToIso } from '../helpers/dates'
import { prepareRecord } from '../helpers/records'
import { getBankIcon } from '../constants/banks'
import { useI18n } from '../i18n/I18nContext'

export default function RecordsPage({ type, data, updateData, initialFilter = 'همه' }) {
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
    const item = prepareRecord({ ...records.editing, title: records.editing.title || 'بدهی ثبت‌شده' })
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
    const debtRecords = item.isCheck ? buildCheckRecords(item) : [item]
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
    const item = prepareRecord(records.editing?.isCheck ? { ...records.editing, title: records.editing.title || `چک دریافتی ${records.editing.person || ''}`.trim() } : records.editing)
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

  return <div className="page">
    <PageHeader eyebrow={records.config.eyebrow} title={records.config.title} subtitle={`${number(records.items.length)} مورد ثبت‌شده`} onAdd={openAdd} onHistory={() => records.setHistoryOpen(true)}/>
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
      onDelete={() => records.remove(records.detail)}
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

const SETTLED_TIME_STATUSES = ['پرداخت شده', 'تسویه‌شده', 'دریافت شده', 'لغوشده']
const isActiveTimeRecord = item => !SETTLED_TIME_STATUSES.includes(item.status)
const filterRecordsByTimeTab = (items, tab, type) => {
  const monthEnd = currentJalaliMonthEndIso()
  return items.filter(item => {
    if (!isActiveTimeRecord(item)) return false
    if (!item.dueDate) return tab === 'current'
    const isFuture = compareDates(item.dueDate, monthEnd) > 0
    return tab === 'future' ? isFuture : !isFuture
  })
}

const filterExpensesByTimeTab = (items, tab) => {
  const monthStart = currentJalaliMonthStartIso()
  return items.filter(item => {
    const date = item.expenseDate || item.dueDate
    if (!date) return tab === 'current'
    return tab === 'past' ? compareDates(date, monthStart) < 0 : inCurrentMonth(date)
  })
}

function RecordTimeTabs({ value, onChange, items, type }) {
  const counts = {
    current: filterRecordsByTimeTab(items, 'current', type).length,
    future: filterRecordsByTimeTab(items, 'future', type).length,
  }
  return <div className="debt-time-tabs" role="tablist" aria-label="بازه رکوردها">
    <button type="button" role="tab" aria-selected={value === 'current'} className={value === 'current' ? 'active' : ''} onClick={() => onChange('current')}>
      <span>جاری</span><i>{number(counts.current)}</i>
    </button>
    <button type="button" role="tab" aria-selected={value === 'future'} className={value === 'future' ? 'active' : ''} onClick={() => onChange('future')}>
      <span>آتی</span><i>{number(counts.future)}</i>
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

const recordDate = item => item.expenseDate || item.dueDate || item.startDate || item.createdAt || ''
const isoDateFromInput = value => {
  if (!value) return ''
  return String(value).includes('/') ? jalaliToIso(value) : value
}
const applyRecordFilters = (items, filters, type) => items.filter(item => {
  const amount = Number(item.amount || 0)
  const date = recordDate(item)
  const fromDate = type === 'currentExpenses' ? jalaliMonthStartIso(filters.dateFrom) : isoDateFromInput(filters.dateFrom)
  const toDate = type === 'currentExpenses' ? jalaliMonthEndIso(filters.dateTo) : isoDateFromInput(filters.dateTo)
  const itemBanks = [item.bank, item.issuerBank, item.receiverBank].filter(Boolean)
  return (!filters.tagFilter || item.tags?.includes(filters.tagFilter)) &&
    (!filters.category || item.category === filters.category) &&
    (!filters.bank || itemBanks.includes(filters.bank)) &&
    (!(filters.tags || []).length || (filters.tags || []).every(tag => item.tags?.includes(tag))) &&
    (!filters.amountFrom || amount >= Number(filters.amountFrom)) &&
    (!filters.amountTo || amount <= Number(filters.amountTo)) &&
    (!fromDate || (date && new Date(date) >= new Date(fromDate))) &&
    (!toDate || (date && new Date(date) <= new Date(toDate)))
})

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

const mergeBankAccount = (accounts = [], nextAccount) => {
  if (!nextAccount || ![nextAccount.bank, nextAccount.account, nextAccount.iban, nextAccount.card].some(Boolean)) return accounts
  const index = accounts.findIndex(account =>
    (nextAccount.id && account.id === nextAccount.id) ||
    (nextAccount.card && account.card === nextAccount.card) ||
    (nextAccount.iban && account.iban === nextAccount.iban) ||
    (nextAccount.account && nextAccount.bank && account.account === nextAccount.account && account.bank === nextAccount.bank)
  )
  if (index === -1) return [{ ...nextAccount, id: nextAccount.id || crypto.randomUUID() }, ...accounts]
  return accounts.map((account, i) => i === index ? { ...account, ...nextAccount, id: account.id || nextAccount.id || crypto.randomUUID() } : account)
}

const applyContactSuggestion = (current, suggestion, mode, targetId) => {
  if (!suggestion) return current
  const now = new Date().toISOString()
  const existing = mode === 'update'
    ? current.financialContacts.find(contact => contact.id === targetId)
    : current.financialContacts.find(contact => contact.title === suggestion.title)
  if (existing) {
    return {
      ...current,
      financialContacts: current.financialContacts.map(contact => {
        if (contact.id !== existing.id) return contact
        const bankAccounts = mergeBankAccount(contact.bankAccounts || [], suggestion.bankAccount)
        const primary = bankAccounts[0] || {}
        return {
          ...contact,
          mobile: suggestion.mobile || contact.mobile || '',
          nationalId: suggestion.nationalId || contact.nationalId || '',
          bank: primary.bank || contact.bank || '',
          account: primary.account || contact.account || '',
          iban: primary.iban || contact.iban || '',
          card: primary.card || contact.card || '',
          bankAccounts,
          updatedAt: now,
        }
      }),
    }
  }
  const bankAccounts = mergeBankAccount([], suggestion.bankAccount)
  return {
    ...current,
    financialContacts: [{
      id: crypto.randomUUID(),
      title: suggestion.title,
      type: 'شخصی',
      mobile: suggestion.mobile,
      nationalId: suggestion.nationalId,
      bank: bankAccounts[0]?.bank || '',
      account: bankAccounts[0]?.account || '',
      iban: bankAccounts[0]?.iban || '',
      card: bankAccounts[0]?.card || '',
      bankAccounts,
      description: 'ثبت‌شده از فرم مالی',
      createdAt: now,
      updatedAt: now,
    }, ...current.financialContacts],
  }
}

function ContactSuggestionModal({ suggestion, contacts, onClose, onSave }) {
  const [targetId, setTargetId] = useState('')
  if (!suggestion) return null
  const sameTitle = contacts.find(contact => contact.title === suggestion.title)
  const selectedId = targetId || sameTitle?.id || ''
  return <Modal open={!!suggestion} title="ذخیره در مخاطبین مالی" onClose={onClose}>
    <div className="form-grid contact-suggestion-sheet">
      <div className="contact-suggestion-hero">
        <strong>{sameTitle ? 'اطلاعات جدید برای مخاطب موجود پیدا شد' : 'این مخاطب هنوز ذخیره نشده است'}</strong>
        <p className="contact-save-message">اطلاعات واردشده برای «{suggestion.title}» قابل ذخیره است. اگر حساب جدید باشد به حساب‌های مخاطب اضافه می‌شود و اگر مشابه باشد جایگزین نمی‌شود.</p>
      </div>
      <div className="suggestion-preview">
        {suggestion.mobile && <span>موبایل: {suggestion.mobile}</span>}
        {suggestion.bankAccount?.bank && <span>بانک: {suggestion.bankAccount.bank}</span>}
        {suggestion.bankAccount?.card && <span>کارت: {suggestion.bankAccount.card}</span>}
        {suggestion.bankAccount?.iban && <span>شبا: {suggestion.bankAccount.iban}</span>}
        {suggestion.bankAccount?.account && <span>حساب: {suggestion.bankAccount.account}</span>}
      </div>
      <div className="form-actions stacked-actions">
        <button type="button" className="secondary-btn" onClick={onClose}>فعلاً نه</button>
        {contacts.length > 0 && <select className="contact-update-select" value={selectedId} onChange={event => setTargetId(event.target.value)}>
          <option value="">انتخاب مخاطب برای آپدیت</option>
          {contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.title}</option>)}
        </select>}
        {selectedId && <button type="button" className="primary-btn" onClick={() => onSave('update', selectedId)}>ویرایش/آپدیت مخاطب انتخاب‌شده</button>}
        <button type="button" className="primary-btn" onClick={() => onSave('create')}>ثبت به عنوان مخاطب جدید</button>
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
