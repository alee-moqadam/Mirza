import { useMemo, useState } from 'react'
import { CONTACT_DEFAULT } from '../constants/settings'

const normalizeContactForEdit = contact => ({
  ...contact,
  bankAccounts: contact.bankAccounts?.length ? contact.bankAccounts : [{
    id: 'primary',
    bank: contact.bank || '',
    account: contact.account || '',
    card: contact.card || '',
    iban: contact.iban || '',
  }],
})

const normalizeContactForSave = contact => {
  const accounts = (contact.bankAccounts || []).filter(item => item.bank || item.account || item.card || item.iban)
  const primary = accounts[0] || { bank: '', account: '', card: '', iban: '' }
  return { ...contact, bankAccounts: accounts, bank: primary.bank, account: primary.account, card: primary.card, iban: primary.iban }
}

export function useSettings(data, updateData) {
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(null)
  const [editType, setEditType] = useState('financialContacts')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const contacts = useMemo(() => data.financialContacts.filter(item =>
    item.title.includes(search) || item.mobile?.includes(search)
  ), [data.financialContacts, search])

  const openEditor = (type, item) => {
    setEditType(type)
    setEditing(item ? (type === 'financialContacts' ? normalizeContactForEdit(item) : { ...item })
      : type === 'financialContacts' ? { ...CONTACT_DEFAULT }
        : type === 'banks' ? { title: '', hasCheckbook: false }
          : { title: '' })
  }

  const closeEditor = () => setEditing(null)

  const save = (event) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const item = { ...(editType === 'financialContacts' ? normalizeContactForSave(editing) : editing), updatedAt: now }
    if (!item.id) {
      item.id = crypto.randomUUID()
      item.createdAt = now
    }
    updateData(current => ({
      ...current,
      [editType]: current[editType].some(record => record.id === item.id)
        ? current[editType].map(record => record.id === item.id ? item : record)
        : [item, ...current[editType]],
    }))
    closeEditor()
  }

  const remove = (type, id) => {
    if (confirm('این مورد حذف شود؟')) {
      updateData(current => ({ ...current, [type]: current[type].filter(item => item.id !== id) }))
    }
  }

  return {
    tab, setTab, editing, setEditing, editType, search, setSearch, detail, setDetail, contacts,
    updateData, openEditor, closeEditor, save, remove,
  }
}
