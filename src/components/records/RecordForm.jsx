import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Info, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Field, FormActions, Modal } from '../UI'
import AmountInput from '../AmountInput'
import JalaliDateInput from '../JalaliDateInput'
import { BankQuickAddModal } from '../BankPicker'
import { BottomSheetSelect, ContactTagPicker, SingleChoice, TagPicker } from '../FormControls'
import { useI18n } from '../../i18n/I18nContext'
import { jalaliToIso, isoToJalali } from '../../helpers/dates'
import { addJalaliPeriod } from '../../helpers/recurrence'
import { getBankIcon } from '../../constants/banks'
import { RECURRENCE_OPTIONS } from '../../constants/records'

export default function RecordForm({ type, config, data, updateData, categories, editing, setEditing, onSave, onClose, currency }) {
  const { t } = useI18n()
  const [openSelect, setOpenSelect] = useState(null)
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [newBankHasCheckbook, setNewBankHasCheckbook] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [newContact, setNewContact] = useState({ title: '', relationTitle: '', mobile: '', type: 'شخصی', bankAccounts: [{ id: 'primary', bank: '', account: '', card: '', iban: '' }] })
  const formOpen = Boolean(editing)
  useEffect(() => {
    if (formOpen) setAdditionalOpen(false)
  }, [formOpen])
  const change = (name) => (event) => setEditing({ ...editing, [name]: event.target.value })
  const setValue = (name, value) => setEditing({ ...editing, [name]: value })
  const changeAmount = event => {
    const amount = event.target.value
    if (type !== 'incomes') return setValue('amount', amount)
    const oldAmount = Number(editing.amount || 0)
    const percent = oldAmount > 0 ? Number(editing.receivedAmount || 0) / oldAmount : editing.status === 'دریافت شده' ? 1 : 0
    setEditing({ ...editing, amount, receivedAmount: Math.round(Number(amount || 0) * percent) })
  }
  const isRequiredField = name => {
    if (type === 'currentExpenses') return ['title', 'amount', 'expenseDate'].includes(name)
    if (type === 'incomes' && !editing?.isCheck) return ['title', 'amount', 'category'].includes(name)
    return false
  }
  const resetNewContact = () => setNewContact({ title: '', relationTitle: '', mobile: '', type: 'شخصی', bankAccounts: [{ id: 'primary', bank: '', account: '', card: '', iban: '' }] })
  const addInlineContact = (selected = []) => {
    const title = newContact.title.trim()
    if (!title) return
    const now = new Date().toISOString()
    const contact = { ...newContact, id: crypto.randomUUID(), title, relationTitle: newContact.relationTitle || '', type: newContact.type || 'شخصی', bankAccounts: normalizeBankAccounts(newContact.bankAccounts), createdAt: now, updatedAt: now }
    updateData?.(current => current.financialContacts.some(item => item.title === title)
      ? current
      : { ...current, financialContacts: [contact, ...current.financialContacts] })
    setValue('contacts', [...new Set([...selected, title])])
    resetNewContact()
    setContactModalOpen(false)
  }
  const modalTitle = editing?.isCheck
    ? `${t(editing?.id ? 'ویرایش' : 'افزودن')} ${t(type === 'incomes' || editing.relation === 'دریافتنی' ? 'چک دریافتی' : 'چک پرداختی')}`
    : type === 'debts'
      ? `${t(editing?.id ? 'ویرایش' : 'افزودن')} ${t('بدهی')}`
      : `${t(editing?.id ? 'ویرایش' : 'افزودن')} ${t(config.title)}`

  return <Modal open={!!editing} title={modalTitle} onClose={onClose}>
    {editing && <form onSubmit={onSave} className="form-grid">
      {editing.isCheck ? <CheckFormFields
        editing={editing} setEditing={setEditing} change={change} setValue={setValue} data={data} updateData={updateData}
        openSelect={openSelect} setOpenSelect={setOpenSelect} currency={currency}
        bankModalOpen={bankModalOpen} setBankModalOpen={setBankModalOpen}
        newBankHasCheckbook={newBankHasCheckbook} setNewBankHasCheckbook={setNewBankHasCheckbook}
        contactModalOpen={contactModalOpen} setContactModalOpen={setContactModalOpen} newContact={newContact} setNewContact={setNewContact} resetNewContact={resetNewContact}
      /> : type === 'debts' ? <DebtFormFields
        editing={editing} setEditing={setEditing} change={change} setValue={setValue} data={data} updateData={updateData} openSelect={openSelect} setOpenSelect={setOpenSelect} currency={currency}
        contactModalOpen={contactModalOpen} setContactModalOpen={setContactModalOpen} newContact={newContact} setNewContact={setNewContact} resetNewContact={resetNewContact}
      /> : type === 'incomes' ? <IncomeFormFields
        editing={editing} setEditing={setEditing} change={change} setValue={setValue} data={data} categories={categories} openSelect={openSelect} setOpenSelect={setOpenSelect} currency={currency} additionalOpen={additionalOpen} setAdditionalOpen={setAdditionalOpen} changeAmount={changeAmount}
      /> : config.fields.map(([label, name, kind, options]) => {
        if (kind === 'amount') return <AmountInput key={name} label={label} value={editing[name]} onChange={name === 'amount' ? changeAmount : change(name)} currency={currency} required={isRequiredField(name)}/>
        if (kind === 'jalaliDate') return <JalaliDateInput key={name} label={label} value={editing[name]} onChange={change(name)} required={isRequiredField(name)}/>
        if (kind === 'recurrenceGroup') return <RecurrenceGroup key={name} label={label} options={options} editing={editing} setEditing={setEditing}/>
        if (kind === 'contacts') {
          const selectedContacts = editing.contacts || (editing.contact ? [editing.contact] : [])
          return <div key={name} className="inline-add-field">
            <ContactTagPicker label={label} contacts={data.financialContacts} value={selectedContacts} onChange={value => setValue('contacts', value)}/>
            <button type="button" className="secondary-btn inline-add-btn" onClick={() => setContactModalOpen(true)}>+ افزودن مخاطب جدید</button>
            <InlineContactEditor open={contactModalOpen} contact={newContact} setContact={setNewContact} data={data} updateData={updateData} title="افزودن مخاطب جدید" submitLabel="افزودن مخاطب" onClose={() => setContactModalOpen(false)} onSubmit={() => addInlineContact(selectedContacts)}/>
          </div>
        }
        if (kind === 'tags') return <TagPicker key={name} label={label} tags={data.tags} value={editing.tags || []} onChange={value => setValue('tags', value)}/>
        if (kind === 'additional') return <AdditionalInformation key={name} open={additionalOpen} setOpen={setAdditionalOpen} editing={editing} setEditing={setEditing}
          openSelect={openSelect} setOpenSelect={setOpenSelect}/>
        if (kind === 'select' || kind === 'category') {
          const selectOptions = kind === 'select' ? options : categories.map(item => item.title)
          return <BottomSheetSelect key={name} label={label} value={editing[name]} options={selectOptions} onChange={value => setValue(name, value)}
            required={isRequiredField(name)}
            open={openSelect === name} onOpen={() => setOpenSelect(name)} onClose={() => setOpenSelect(null)}/>
        }
        return <Field key={name} label={label} name={name} type={kind} value={editing[name]} onChange={change(name)} required={isRequiredField(name)}/>
      })}
      <FormActions onCancel={onClose} />
    </form>}
  </Modal>
}

const addMonthsToJalali = (value, months) => {
  const iso = jalaliToIso(value) || value
  if (!iso) return ''
  const next = addJalaliPeriod(iso, 'ماهانه', Math.max(0, Number(months || 0) - 1))
  return next ? isoToJalali(next) : ''
}

const contactPaymentOptions = contact => (contact?.bankAccounts || []).flatMap(account => [
  account.account && { label: `${account.bank || 'بانک'} • شماره حساب ${account.account}`, account, kind: 'account' },
  account.card && { label: `${account.bank || 'بانک'} • شماره کارت ${account.card}`, account, kind: 'card' },
  account.iban && { label: `${account.bank || 'بانک'} • شماره شبا ${account.iban}`, account, kind: 'iban' },
].filter(Boolean))

const normalizeBankAccounts = accounts => (accounts?.length ? accounts : [{ id: 'primary', bank: '', account: '', card: '', iban: '' }])
  .map(account => ({ ...account, id: account.id || crypto.randomUUID() }))
  .filter(account => account.bank || account.account || account.card || account.iban)

function DebtFormFields({ editing, setEditing, change, setValue, data, updateData, openSelect, setOpenSelect, currency, contactModalOpen, setContactModalOpen, newContact, setNewContact, resetNewContact }) {
  const [editingContactId, setEditingContactId] = useState(null)
  const [debtBankModalOpen, setDebtBankModalOpen] = useState(false)
  const selectedContact = (data.financialContacts || []).find(contact => contact.title === (editing.contact || editing.contacts?.[0]))
  const contactOptions = (data.financialContacts || []).map(contact => contact.title)
  const paymentOptions = contactPaymentOptions(selectedContact)
  const accountOptions = paymentOptions.map(option => option.label)
  const applyPeriodicPatch = patch => {
    const next = { ...editing, ...patch }
    if (next.isPeriodic) {
      next.recurrence = next.recurrence && next.recurrence !== 'فقط یک‌بار' ? next.recurrence : 'ماهانه'
      next.endless = false
      if ((next.startDate || next.loanStartDate || next.dueDate) && next.loanDurationMonths) next.endDate = addMonthsToJalali(next.startDate || next.loanStartDate || next.dueDate, Number(next.loanDurationMonths))
    } else if (Object.prototype.hasOwnProperty.call(patch, 'isPeriodic')) {
      next.recurrence = 'فقط یک‌بار'
      next.endless = false
      next.endDate = ''
    }
    setEditing(next)
  }
  const setLoanDuration = value => {
    const loanDurationMonths = Math.max(0, Number(value || 0))
    applyPeriodicPatch({ loanDurationMonths })
  }
  const setInterestRate = value => {
    const interestRate = Math.max(0, Number(value || 0))
    setValue('interestRate', interestRate)
  }
  const addDebtBank = bank => {
    updateData?.(current => current.banks.some(item => item.title === bank.title)
      ? current
      : { ...current, banks: [bank, ...current.banks] })
    setValue('loanBank', bank.title)
    setDebtBankModalOpen(false)
    setOpenSelect(null)
  }
  const selectContact = title => {
    const contact = (data.financialContacts || []).find(item => item.title === title)
    const firstPaymentOption = contactPaymentOptions(contact)[0]
    const firstAccount = firstPaymentOption?.account
    setEditing({
      ...editing,
      contact: title,
      contacts: title ? [title] : [],
      paymentAccountId: firstPaymentOption ? `${firstAccount?.id || ''}:${firstPaymentOption.kind}` : '',
      receiverBank: firstAccount?.bank || '',
      account: firstPaymentOption?.kind === 'account' ? firstAccount?.account || '' : '',
      iban: firstPaymentOption?.kind === 'iban' ? firstAccount?.iban || '' : '',
      card: firstPaymentOption?.kind === 'card' ? firstAccount?.card || '' : '',
    })
  }
  const openAddContact = () => {
    setEditingContactId(null)
    resetNewContact()
    setContactModalOpen(true)
  }
  const openEditContact = title => {
    const contact = (data.financialContacts || []).find(item => item.title === title)
    if (!contact) return
    setEditingContactId(contact.id)
    setNewContact({
      ...contact,
      bankAccounts: contact.bankAccounts?.length ? contact.bankAccounts : [{ id: 'primary', bank: '', account: '', card: '', iban: '' }],
    })
    setContactModalOpen(true)
  }
  const saveContact = () => {
    const title = newContact.title.trim()
    if (!title) return
    const now = new Date().toISOString()
    const contact = { ...newContact, id: editingContactId || newContact.id || crypto.randomUUID(), title, relationTitle: newContact.relationTitle || '', type: newContact.type || 'شخصی', bankAccounts: normalizeBankAccounts(newContact.bankAccounts), updatedAt: now, createdAt: newContact.createdAt || now }
    updateData?.(current => {
      const exists = current.financialContacts.some(item => item.id === contact.id)
      if (exists) return { ...current, financialContacts: current.financialContacts.map(item => item.id === contact.id ? contact : item) }
      if (current.financialContacts.some(item => item.title === title)) return current
      return { ...current, financialContacts: [contact, ...current.financialContacts] }
    })
    selectContact(title)
    setEditingContactId(null)
    resetNewContact()
    setContactModalOpen(false)
    setOpenSelect(null)
  }
  const selectAccount = label => {
    const option = paymentOptions.find(item => item.label === label)
    const account = option?.account
    setEditing({
      ...editing,
      paymentAccountId: option ? `${account?.id || ''}:${option.kind}` : '',
      receiverBank: account?.bank || '',
      account: option?.kind === 'account' ? account?.account || '' : '',
      iban: option?.kind === 'iban' ? account?.iban || '' : '',
      card: option?.kind === 'card' ? account?.card || '' : '',
    })
  }
  const accountValue = (
    paymentOptions.find(option => `${option.account?.id || ''}:${option.kind}` === editing.paymentAccountId) ||
    paymentOptions.find(option => option.account?.id === editing.paymentAccountId && (
      (option.kind === 'account' && editing.account) ||
      (option.kind === 'card' && editing.card) ||
      (option.kind === 'iban' && editing.iban)
    ))
  )?.label || ''

  return <>
    <Field label="عنوان بدهی" value={editing.title} onChange={change('title')} required />
    <AmountInput label="مبلغ" value={editing.amount} onChange={change('amount')} currency={currency} required/>
    <JalaliDateInput label={editing.isPeriodic ? 'اولین سررسید' : 'تاریخ سررسید'} value={editing.dueDate} onChange={event => applyPeriodicPatch({ dueDate: event.target.value })}/>
    <section className="form-section-container debt-account-group">
      <BottomSheetSelect label="مخاطب مالی" value={editing.contact || editing.contacts?.[0] || ''} options={contactOptions} onChange={selectContact}
        open={openSelect === 'debtContact'} onOpen={() => setOpenSelect('debtContact')} onClose={() => setOpenSelect(null)}
        headerAction={<button type="button" className="sheet-add-option" onClick={openAddContact}>+ افزودن مخاطب جدید</button>}
        optionAction={option => <button type="button" className="sheet-option-edit" aria-label={`ویرایش ${option}`} onClick={event => { event.stopPropagation(); openEditContact(option) }}><Pencil size={15}/></button>}/>
      {selectedContact && <>
        <div className="account-contact-summary"><strong>{selectedContact.relationTitle || selectedContact.type || 'بدون عنوان'}</strong><span>{selectedContact.mobile || 'بدون شماره موبایل'}</span></div>
        <BottomSheetSelect label="بانک و حساب مقصد" value={accountValue} options={accountOptions} onChange={selectAccount}
          open={openSelect === 'paymentAccount'} onOpen={() => setOpenSelect('paymentAccount')} onClose={() => setOpenSelect(null)}/>
        {!accountOptions.length && <p className="field-hint">برای این مخاطب حساب بانکی ثبت نشده است.</p>}
      </>}
    </section>
    <section className="form-section-container periodic-group">
      <Toggle label="پرداخت دوره‌ای" checked={Boolean(editing.isPeriodic)} onChange={isPeriodic => applyPeriodicPatch({ isPeriodic })}/>
      {editing.isPeriodic && <>
        <JalaliDateInput label="تاریخ شروع پرداخت دوره‌ای" value={editing.startDate || editing.loanStartDate || ''} onChange={event => applyPeriodicPatch({ startDate: event.target.value })}/>
        <LoanDurationStepper value={editing.loanDurationMonths} onChange={setLoanDuration}/>
        <RecurrenceGroup label="دوره پرداخت" options={RECURRENCE_OPTIONS} editing={editing} setEditing={setEditing} plain/>
        <p className="field-hint">تاریخ شروع مبنای ساخت دوره‌های بعدی و محاسبه تاریخ پایان است؛ سررسید فقط پرداخت بعدی را مشخص می‌کند.</p>
      </>}
    </section>
    <section className="form-section-container loan-group">
      <Toggle label="وام بودن" checked={Boolean(editing.isLoan)} onChange={isLoan => setValue('isLoan', isLoan)}/>
      {editing.isLoan && <>
        <BottomSheetSelect label="نام بانک" value={editing.loanBank || ''} options={(data.banks || []).map(item => item.title)} onChange={value => setValue('loanBank', value)}
          open={openSelect === 'loanBank'} onOpen={() => setOpenSelect('loanBank')} onClose={() => setOpenSelect(null)}
          headerAction={<button type="button" className="sheet-add-option" onClick={() => setDebtBankModalOpen(true)}>+ افزودن بانک</button>}
          optionIcon={getBankIcon}/>
        <InterestRateStepper value={editing.interestRate} onChange={setInterestRate}/>
        <AmountInput label="مبلغ کل وام" value={editing.loanTotalAmount} onChange={change('loanTotalAmount')} currency={currency}/>
      </>}
    </section>
    <TagPicker label="تگ‌ها" tags={data.tags} value={editing.tags || []} onChange={value => setValue('tags', value)}/>
    <Field label="توضیحات" type="textarea" value={editing.description} onChange={change('description')} />
    <Modal open={debtBankModalOpen} title="افزودن بانک" onClose={() => setDebtBankModalOpen(false)}>
      <BankQuickAddModal banks={data.banks || []} onClose={() => setDebtBankModalOpen(false)} onAdd={addDebtBank}/>
    </Modal>
    <InlineContactEditor open={contactModalOpen} contact={newContact} setContact={setNewContact} data={data} updateData={updateData}
      title={editingContactId ? 'ویرایش مخاطب مالی' : 'افزودن مخاطب جدید'} submitLabel={editingContactId ? 'ذخیره تغییرات' : 'افزودن مخاطب'}
      onClose={() => { setEditingContactId(null); setContactModalOpen(false) }} onSubmit={saveContact}/>
  </>
}

function IncomeFormFields({ editing, setEditing, change, setValue, data, categories, openSelect, setOpenSelect, currency, additionalOpen, setAdditionalOpen, changeAmount }) {
  const applyPeriodicPatch = patch => {
    const next = { ...editing, ...patch }
    if (next.isPeriodic) {
      next.recurrence = next.recurrence && next.recurrence !== 'فقط یک‌بار' ? next.recurrence : 'ماهانه'
      next.endless = false
      if ((next.startDate || next.dueDate) && next.loanDurationMonths) next.endDate = addMonthsToJalali(next.startDate || next.dueDate, Number(next.loanDurationMonths))
    } else if (Object.prototype.hasOwnProperty.call(patch, 'isPeriodic')) {
      next.recurrence = 'فقط یک‌بار'
      next.endless = false
      next.endDate = ''
    }
    setEditing(next)
  }
  const setIncomeDuration = value => applyPeriodicPatch({ loanDurationMonths: Math.max(0, Number(value || 0)) })

  return <>
    <Field label="عنوان درآمد" value={editing.title} onChange={change('title')} required/>
    <AmountInput label="مبلغ کل" value={editing.amount} onChange={changeAmount} currency={currency} required/>
    <JalaliDateInput label={editing.isPeriodic ? 'اولین سررسید دریافت' : 'تاریخ دریافت'} value={editing.dueDate} onChange={event => applyPeriodicPatch({ dueDate: event.target.value })}/>
    <section className="form-section-container periodic-group">
      <Toggle label="پرداخت دوره‌ای" checked={Boolean(editing.isPeriodic)} onChange={isPeriodic => applyPeriodicPatch({ isPeriodic })}/>
      {editing.isPeriodic && <>
        <JalaliDateInput label="تاریخ شروع پرداخت دوره‌ای" value={editing.startDate} onChange={event => setEditing({ ...editing, startDate: event.target.value })}/>
        <LoanDurationStepper value={editing.loanDurationMonths} onChange={setIncomeDuration}/>
        <RecurrenceGroup label="دوره پرداخت" options={RECURRENCE_OPTIONS} editing={editing} setEditing={setEditing} plain/>
        <p className="field-hint">تاریخ شروع مبنای ساخت دوره‌های بعدی و محاسبه تاریخ پایان است؛ سررسید فقط دریافت بعدی را مشخص می‌کند.</p>
      </>}
    </section>
    <BottomSheetSelect label="دسته‌بندی درآمد" value={editing.category} options={categories.map(item => item.title)} onChange={value => setValue('category', value)}
      required open={openSelect === 'category'} onOpen={() => setOpenSelect('category')} onClose={() => setOpenSelect(null)}/>
    <ContactTagPicker label="مخاطب مالی مرتبط" contacts={data.financialContacts} value={editing.contacts || (editing.contact ? [editing.contact] : [])} onChange={value => setValue('contacts', value)}/>
    <TagPicker label="تگ‌ها" tags={data.tags} value={editing.tags || []} onChange={value => setValue('tags', value)}/>
    <AdditionalInformation open={additionalOpen} setOpen={setAdditionalOpen} editing={editing} setEditing={setEditing}
      openSelect={openSelect} setOpenSelect={setOpenSelect}/>
  </>
}

function InlineContactEditor({ open, contact, setContact, data, updateData, title, submitLabel, onClose, onSubmit }) {
  const [openSelect, setOpenSelect] = useState(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const accounts = contact.bankAccounts?.length ? contact.bankAccounts : [{ id: 'primary', bank: '', account: '', card: '', iban: '' }]
  const change = name => event => setContact({ ...contact, [name]: event.target.value })
  const updateAccount = (id, patch) => setContact({ ...contact, bankAccounts: accounts.map(item => item.id === id ? { ...item, ...patch } : item) })
  const addAccount = () => setContact({ ...contact, bankAccounts: [...accounts, { id: crypto.randomUUID(), bank: '', account: '', card: '', iban: '' }] })
  const removeAccount = id => setContact({
    ...contact,
    bankAccounts: accounts.length > 1
      ? accounts.filter(item => item.id !== id)
      : accounts.map(item => item.id === id ? { ...item, bank: '', account: '', card: '', iban: '' } : item),
  })
  const addBank = bank => {
    updateData?.(current => current.banks.some(item => item.title === bank.title)
      ? current
      : { ...current, banks: [bank, ...current.banks] })
    setBankModalOpen(false)
  }

  return <Modal open={open} title={title} onClose={onClose}>
    {contact && <div className="form-grid">
      <Field label="نام شخص / سازمان" value={contact.title || ''} onChange={change('title')} required/>
      <label className="field titled-info-field">
        <span>عنوان <Info size={15} aria-label="راهنمای عنوان" /></span>
        <input value={contact.relationTitle || ''} onChange={change('relationTitle')} />
        <small className="field-hint">در این فیلد می‌توانید نسبت، شرکت یا عنوانی دلخواه برای یادآوری بهتر این مخاطب وارد کنید.</small>
      </label>
      <BottomSheetSelect label="نوع مخاطب" value={contact.type || 'شخصی'} options={['شخصی', 'شرکت', 'بانک', 'سازمان']} onChange={type => setContact({ ...contact, type })}
        open={openSelect === 'inline-contact-type'} onOpen={() => setOpenSelect('inline-contact-type')} onClose={() => setOpenSelect(null)}/>
      <Field label="شماره موبایل، اختیاری" value={contact.mobile || ''} onChange={change('mobile')}/>
      <section className="soft-form-group contact-bank-accounts">
        <div className="inline-section-title"><strong>اطلاعات بانکی مخاطب</strong></div>
        {accounts.map((account, index) => <div className="contact-bank-account" key={account.id}>
          <div className="account-row-title"><span>بانک {index + 1}</span><button type="button" className="icon-btn danger-icon-btn" aria-label="حذف بانک" onClick={() => removeAccount(account.id)}><Trash2 size={17}/></button></div>
          <BottomSheetSelect label="نام بانک" value={account.bank || ''} options={(data.banks || []).map(item => item.title)} onChange={bank => updateAccount(account.id, { bank })}
            open={openSelect === `inline-contact-bank-${account.id}`} onOpen={() => setOpenSelect(`inline-contact-bank-${account.id}`)} onClose={() => setOpenSelect(null)}
            headerAction={<button type="button" className="sheet-add-option" onClick={() => setBankModalOpen(true)}>+ افزودن بانک</button>}
            optionIcon={getBankIcon}/>
          <Field label="شماره حساب" value={account.account || ''} onChange={event => updateAccount(account.id, { account: event.target.value })}/>
          <Field label="شماره کارت" value={account.card || ''} onChange={event => updateAccount(account.id, { card: event.target.value })}/>
          <Field label="شماره شبا" value={account.iban || ''} onChange={event => updateAccount(account.id, { iban: event.target.value })}/>
        </div>)}
        <button type="button" className="secondary-btn add-bank-account-btn" onClick={addAccount}><Plus size={17}/> افزودن بانک دیگر</button>
      </section>
      <Field label="کد ملی" value={contact.nationalId || ''} onChange={change('nationalId')}/>
      <Field label="توضیحات" type="textarea" value={contact.description || ''} onChange={change('description')}/>
      <div className="form-actions"><button type="button" className="secondary-btn" onClick={onClose}>انصراف</button><button type="button" className="primary-btn" onClick={onSubmit}>{submitLabel}</button></div>
    </div>}
    <Modal open={bankModalOpen} title="افزودن بانک" onClose={() => setBankModalOpen(false)}>
      <BankQuickAddModal banks={data.banks || []} onClose={() => setBankModalOpen(false)} onAdd={addBank}/>
    </Modal>
  </Modal>
}

function LoanDurationStepper({ value, onChange }) {
  const numericValue = Math.max(0, Number(value || 0))
  const handleInput = event => {
    const next = event.target.value.replace(/[^\d]/g, '')
    onChange(next === '' ? 0 : Number(next))
  }

  return <div className="field number-stepper-field">
    <label>مدت زمان پرداخت دوره‌ای</label>
    <div className="number-stepper" dir="ltr">
      <button type="button" aria-label="کاهش مدت زمان پرداخت دوره‌ای" onClick={() => onChange(Math.max(0, numericValue - 1))} disabled={numericValue <= 0}>
        <Minus size={17} />
      </button>
      <input inputMode="numeric" pattern="[0-9]*" min="0" value={numericValue} onChange={handleInput} aria-label="مدت زمان پرداخت دوره‌ای به ماه" />
      <button type="button" aria-label="افزایش مدت زمان پرداخت دوره‌ای" onClick={() => onChange(numericValue + 1)}>
        <Plus size={17} />
      </button>
    </div>
  </div>
}

function InterestRateStepper({ value, onChange }) {
  const numericValue = Math.max(0, Number(value || 0))
  const handleInput = event => {
    const next = event.target.value.replace(/[^\d]/g, '')
    onChange(next === '' ? 0 : Number(next))
  }

  return <div className="field number-stepper-field">
    <label>درصد سود</label>
    <div className="number-stepper" dir="ltr">
      <button type="button" aria-label="کاهش درصد سود" onClick={() => onChange(Math.max(0, numericValue - 1))} disabled={numericValue <= 0}>
        <Minus size={17} />
      </button>
      <div className="number-stepper-center">
        <input inputMode="numeric" pattern="[0-9]*" min="0" value={numericValue} onChange={handleInput} aria-label="درصد سود" />
        <span aria-hidden="true">%</span>
      </div>
      <button type="button" aria-label="افزایش درصد سود" onClick={() => onChange(numericValue + 1)}>
        <Plus size={17} />
      </button>
    </div>
  </div>
}

function RecurrenceGroup({ label, options, editing, setEditing, plain = false }) {
  return <section className={`${plain ? 'plain-recurrence-group' : 'soft-form-group'} recurrence-group`}>
    <SingleChoice label={label} value={editing.recurrence} options={options} onChange={recurrence => setEditing({ ...editing, recurrence })}/>
    <Toggle className="inline-toggle" label="تکرارشونده بدون تاریخ پایان" checked={editing.endless} onChange={endless => setEditing({ ...editing, endless })}/>
    <JalaliDateInput label="تاریخ پایان" value={editing.endDate} disabled={editing.endless} onChange={event => setEditing({ ...editing, endDate: event.target.value })}/>
  </section>
}

function CheckFormFields({ editing, setEditing, change, setValue, data, updateData, openSelect, setOpenSelect, currency, bankModalOpen, setBankModalOpen, newBankHasCheckbook, setNewBankHasCheckbook, contactModalOpen, setContactModalOpen, newContact, setNewContact, resetNewContact }) {
  const [editingContactId, setEditingContactId] = useState(null)
  const checkbookBanks = (data.banks || []).filter(bank => bank.hasCheckbook).map(bank => bank.title)
  const isReceivableCheck = editing.relation === 'دریافتنی' || editing.direction === 'receivable'
  const bankOptions = isReceivableCheck ? (data.banks || []).map(bank => bank.title) : checkbookBanks
  const selectedPersonContact = (data.financialContacts || []).find(contact => contact.title === editing.person)
  const contactOptions = (data.financialContacts || []).map(contact => contact.title)
  const checkItems = editing.checkItems?.length ? editing.checkItems : [{ id: 'primary-check', checkNumber: editing.checkNumber || '', dueDate: editing.dueDate || '' }]
  const updateCheckItem = (id, patch) => {
    const nextItems = checkItems.map(item => item.id === id ? { ...item, ...patch } : item)
    const first = nextItems[0] || {}
    setEditing({ ...editing, checkItems: nextItems, checkNumber: first.checkNumber || '', dueDate: first.dueDate || '' })
  }
  const addCheckItem = () => setEditing({ ...editing, checkItems: [...checkItems, { id: crypto.randomUUID(), checkNumber: '', dueDate: '' }] })
  const removeCheckItem = id => {
    const nextItems = checkItems.length > 1 ? checkItems.filter(item => item.id !== id) : [{ ...checkItems[0], checkNumber: '', dueDate: '' }]
    const first = nextItems[0] || {}
    setEditing({ ...editing, checkItems: nextItems, checkNumber: first.checkNumber || '', dueDate: first.dueDate || '' })
  }
  const addBank = bank => {
    const nextBank = { ...bank, hasCheckbook: newBankHasCheckbook || bank.hasCheckbook }
    updateData?.(current => current.banks.some(item => item.title === nextBank.title)
      ? current
      : { ...current, banks: [nextBank, ...current.banks] })
    setValue('issuerBank', nextBank.title)
    setNewBankHasCheckbook(false)
    setBankModalOpen(false)
    setOpenSelect(null)
  }
  const selectPerson = person => {
    const contact = (data.financialContacts || []).find(item => item.title === person)
    setEditing({
      ...editing,
      person,
      contact: person,
      contacts: person ? [person] : [],
      mobile: contact?.mobile || editing.mobile || '',
      nationalId: contact?.nationalId || editing.nationalId || '',
    })
  }
  const openAddContact = () => {
    setEditingContactId(null)
    resetNewContact()
    setContactModalOpen(true)
  }
  const openEditContact = title => {
    const contact = (data.financialContacts || []).find(item => item.title === title)
    if (!contact) return
    setEditingContactId(contact.id)
    setNewContact({
      ...contact,
      bankAccounts: contact.bankAccounts?.length ? contact.bankAccounts : [{ id: 'primary', bank: '', account: '', card: '', iban: '' }],
    })
    setContactModalOpen(true)
  }
  const saveContact = () => {
    const title = newContact.title.trim()
    if (!title) return
    const now = new Date().toISOString()
    const contact = { ...newContact, id: editingContactId || newContact.id || crypto.randomUUID(), title, relationTitle: newContact.relationTitle || '', type: newContact.type || 'شخصی', bankAccounts: normalizeBankAccounts(newContact.bankAccounts), updatedAt: now, createdAt: newContact.createdAt || now }
    updateData?.(current => {
      const exists = current.financialContacts.some(item => item.id === contact.id)
      if (exists) return { ...current, financialContacts: current.financialContacts.map(item => item.id === contact.id ? contact : item) }
      if (current.financialContacts.some(item => item.title === title)) return current
      return { ...current, financialContacts: [contact, ...current.financialContacts] }
    })
    selectPerson(title)
    setEditingContactId(null)
    resetNewContact()
    setContactModalOpen(false)
    setOpenSelect(null)
  }

  return <>
    <section className="soft-form-group check-form-block">
      {!isReceivableCheck && <Field label="موضوع چک" value={editing.title} onChange={change('title')} required />}
      <div className="check-person-picker">
        <BottomSheetSelect label="مخاطب مالی" value={contactOptions.includes(editing.person) ? editing.person : ''} options={contactOptions} onChange={selectPerson}
          open={openSelect === 'checkPerson'} onOpen={() => setOpenSelect('checkPerson')} onClose={() => setOpenSelect(null)}
          headerAction={<button type="button" className="sheet-add-option" onClick={openAddContact}>+ افزودن مخاطب جدید</button>}
          optionAction={option => <button type="button" className="sheet-option-edit" aria-label={`ویرایش ${option}`} onClick={event => { event.stopPropagation(); openEditContact(option) }}><Pencil size={15}/></button>}
          required/>
        {selectedPersonContact && <div className="readonly-contact-summary">
          <div><span>شماره موبایل</span><strong>{selectedPersonContact.mobile || 'ثبت نشده'}</strong></div>
          <div><span>کد ملی</span><strong>{selectedPersonContact.nationalId || 'ثبت نشده'}</strong></div>
        </div>}
      </div>
      <AmountInput label="مبلغ" value={editing.amount} onChange={change('amount')} currency={currency} required/>
      <BottomSheetSelect label={isReceivableCheck ? 'بانک چک دریافتی' : 'بانک دسته چک'} value={editing.issuerBank} options={bankOptions} onChange={value => setValue('issuerBank', value)}
        open={openSelect === 'issuerBank'} onOpen={() => setOpenSelect('issuerBank')} onClose={() => setOpenSelect(null)}
        headerAction={<button type="button" className="sheet-add-option" onClick={() => setBankModalOpen(true)}>+ افزودن بانک</button>}
        optionIcon={getBankIcon}
        required/>
      {!isReceivableCheck && !checkbookBanks.length && <p className="field-hint">در تنظیمات بانک‌ها، هیچ بانکی با دسته چک فعال نشده است.</p>}
      <section className="check-items-group">
        <div className="inline-section-title"><strong>شماره چک‌ها و سررسیدها</strong><button type="button" onClick={addCheckItem}>+ افزودن چک</button></div>
        {checkItems.map((item, index) => <div className="check-item-row" key={item.id}>
          <div className="account-row-title"><span>چک {index + 1}</span><button type="button" className="icon-btn danger-icon-btn" aria-label="حذف چک" onClick={() => removeCheckItem(item.id)}><Trash2 size={17}/></button></div>
          <Field label="شماره چک" value={item.checkNumber || ''} onChange={event => updateCheckItem(item.id, { checkNumber: event.target.value })} required />
          <JalaliDateInput label="تاریخ سررسید" value={item.dueDate || ''} onChange={event => updateCheckItem(item.id, { dueDate: event.target.value })} required/>
        </div>)}
      </section>
    </section>

    <TagPicker label="تگ‌ها" tags={data.tags} value={editing.tags || []} onChange={value => setValue('tags', value)}/>
    <Field label="توضیحات" type="textarea" value={editing.description} onChange={change('description')} />
    <InlineContactEditor open={contactModalOpen} contact={newContact} setContact={setNewContact} data={data} updateData={updateData}
      title={editingContactId ? 'ویرایش مخاطب مالی' : 'افزودن مخاطب جدید'} submitLabel={editingContactId ? 'ذخیره تغییرات' : 'افزودن مخاطب'}
      onClose={() => { setEditingContactId(null); setContactModalOpen(false) }} onSubmit={saveContact}/>
    <Modal open={bankModalOpen} title="افزودن بانک" onClose={() => setBankModalOpen(false)}>
      {!isReceivableCheck && <Toggle label="برای این بانک دسته چک دارم" checked={newBankHasCheckbook} onChange={setNewBankHasCheckbook}/>}
      <BankQuickAddModal banks={data.banks || []} onClose={() => setBankModalOpen(false)} onAdd={addBank} checkbookDefault={!isReceivableCheck && newBankHasCheckbook}/>
    </Modal>
  </>
}

function AdditionalInformation({ open, setOpen, editing, setEditing, openSelect, setOpenSelect }) {
  const { t } = useI18n()
  return <section className="additional-information">
    <button type="button" className="additional-trigger" onClick={() => setOpen(!open)}>{t('اطلاعات اضافی')}{open ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button>
    {open && <div className="additional-fields">
      <BottomSheetSelect label="وضعیت قطعیت" value={editing.certainty} options={['قطعی', 'احتمالی', 'در انتظار تأیید']} onChange={certainty => setEditing({ ...editing, certainty })}
        open={openSelect === 'certainty'} onOpen={() => setOpenSelect('certainty')} onClose={() => setOpenSelect(null)}/>
      <Field label="توضیحات" type="textarea" value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })}/>
    </div>}
  </section>
}

function Toggle({ label, checked, onChange, className = 'toggle-row' }) {
  return <label className={className}>
    <span>{useI18n().t(label)}</span>
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    <i />
  </label>
}
