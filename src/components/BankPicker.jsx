import { useMemo, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { BANK_CATALOG, createBankRecord, getBankIcon } from '../constants/banks'

export function BankName({ title, className = '', neutral = false }) {
  const icon = getBankIcon(title)
  return <span className={`bank-name ${neutral ? 'neutral' : ''} ${className}`}>
    {icon && <img src={icon} alt="" />}
    <span>{title}</span>
  </span>
}

export function BankCatalogList({ banks = [], onToggle, onCheckbookChange, onSelect, selectedTitle = '', selectable = false }) {
  const [query, setQuery] = useState('')
  const activeMap = new Map((banks || []).map(bank => [bank.title, bank]))
  const extraBanks = (banks || []).filter(bank => !BANK_CATALOG.some(item => item.title === bank.title))
  const rows = useMemo(() => {
    const allRows = [...BANK_CATALOG, ...extraBanks.map(bank => ({ title: bank.title, icon: bank.icon || getBankIcon(bank.title) }))]
    const normalizedQuery = query.trim().replace(/\s+/g, '')
    const filtered = normalizedQuery
      ? allRows.filter(item => item.title.replace(/\s+/g, '').includes(normalizedQuery))
      : allRows
    return filtered.sort((left, right) => Number(activeMap.has(right.title)) - Number(activeMap.has(left.title)))
  }, [banks, query])
  const activeCount = rows.filter(item => activeMap.has(item.title)).length
  const inactiveCount = rows.length - activeCount

  return <div className="bank-catalog-wrap">
    <label className="bank-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی نام بانک" /></label>
    <div className="bank-catalog-list">
      {activeCount > 0 && <span className="bank-catalog-divider">بانک‌های فعال</span>}
      {rows.map((item, index) => {
        const active = activeMap.get(item.title)
        const isSelected = selectedTitle === item.title
        const showInactiveDivider = index === activeCount && inactiveCount > 0
        return <div key={item.title}>
          {showInactiveDivider && <span className="bank-catalog-divider">سایر بانک‌ها</span>}
          <div className={`bank-catalog-row ${active ? 'active' : ''} ${isSelected ? 'selected' : ''}`}>
            <button type="button" className="bank-catalog-main" onClick={() => selectable ? onSelect?.(item.title) : onToggle?.(item.title, !active)}>
              <BankName title={item.title}/>
              {selectable ? isSelected && <Check size={17}/> : <span className="mini-switch" aria-hidden="true"><i/></span>}
            </button>
            {active && onCheckbookChange && <label className="bank-checkbook-toggle">
              <span>دسته چک</span>
              <input type="checkbox" checked={!!active.hasCheckbook} onChange={event => onCheckbookChange(item.title, event.target.checked)} />
              <i/>
            </label>}
          </div>
        </div>
      })}
      {!rows.length && <p className="settings-note">بانکی با این نام پیدا نشد.</p>}
    </div>
  </div>
}

export function BankQuickAddModal({ banks = [], onClose, onAdd, checkbookDefault = false }) {
  const [query, setQuery] = useState('')
  const activeTitles = new Set((banks || []).map(bank => bank.title))
  const rows = BANK_CATALOG
    .filter(bank => !query.trim() || bank.title.replace(/\s+/g, '').includes(query.trim().replace(/\s+/g, '')))
    .sort((left, right) => Number(activeTitles.has(right.title)) - Number(activeTitles.has(left.title)))
  const add = bankTitle => {
    const existing = (banks || []).find(bank => bank.title === bankTitle)
    onAdd(existing || createBankRecord(bankTitle, { hasCheckbook: checkbookDefault }))
  }
  return <div className="bank-quick-add">
    <div className="settings-note bank-picker-note">بانک را از لیست لوگوهای موجود انتخاب کنید.</div>
    <label className="bank-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی نام بانک" /></label>
    <div className="bank-catalog-list compact">
      {rows.map(bank => {
        const active = activeTitles.has(bank.title)
        return <button key={bank.title} type="button" className={`bank-catalog-select ${active ? 'active' : ''}`} onClick={() => add(bank.title)}>
          <BankName title={bank.title}/>
          <span>{active ? <Check size={16}/> : <Plus size={16}/>}</span>
        </button>
      })}
      {!rows.length && <p className="settings-note">بانکی با این نام پیدا نشد.</p>}
    </div>
    <div className="form-actions"><button type="button" className="secondary-btn" onClick={onClose}>انصراف</button></div>
  </div>
}
