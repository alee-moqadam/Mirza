import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Landmark, Pencil, Plus, ReceiptText, Search, SlidersHorizontal, Target, Trash2, TrendingUp, Wallet, X } from 'lucide-react'
import AmountDisplay from '../components/AmountDisplay'
import AmountInput from '../components/AmountInput'
import { Badge, Field, FormActions, Modal, PageHeader } from '../components/UI'
import { dashboardStats, expenseComposition } from '../helpers/calculations'
import { dateLabel, formatNumber } from '../helpers/formatters'
import { currentJalaliMonthEndIso } from '../helpers/dates'
import { useI18n } from '../i18n/I18nContext'
import { APP_LOGO_PATH } from '../config/app'

export default function Dashboard({ data, updateData, navigate }) {
  const { t } = useI18n()
  const s = dashboardStats(data)
  const currency = data.currency || 'تومان'
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ category: '', contact: '', type: '', status: '', date: '' })
  const searchRef = useRef(null)
  useEffect(() => {
    const closeOnOutsideInteraction = event => {
      if (searchExpanded && !filterOpen && !searchRef.current?.contains(event.target)) setSearchExpanded(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [searchExpanded, filterOpen])
  const composition = expenseComposition(data)
  const records = useMemo(() => [...(data.incomes || []).map(item => ({ ...item, kind: item.isCheck ? 'چک دریافتی' : 'درآمد' })), ...(data.debts || []).map(item => ({ ...item, kind: item.isCheck ? 'چک پرداختی' : 'بدهی' })), ...(data.currentExpenses || []).map(item => ({ ...item, kind: 'هزینه جاری' }))], [data])
  const results = records.filter(item => {
    const haystack = [item.title, item.description, item.category, ...(item.tags || []), ...(item.contacts || [])].join(' ')
    const date = item.expenseDate || item.dueDate
    const monthMatches = !filters.date || (filters.date === 'ماه جاری' && date && new Date(date).getMonth() === new Date().getMonth()) || (filters.date === 'ماه قبل' && date && new Date(date).getMonth() === (new Date().getMonth() + 11) % 12)
    return (!query || haystack.includes(query)) && (!tag || item.tags?.includes(tag)) && (!filters.category || item.category === filters.category) && (!filters.contact || item.contacts?.includes(filters.contact) || item.contact === filters.contact) && (!filters.type || item.kind === filters.type) && (!filters.status || item.status === filters.status) && monthMatches
  })
  const cards = [['مجموع درآمد ماه جاری',s.totalIncome,'green',ArrowDownLeft],['درآمد دریافت‌شده',s.received,'green',Wallet],['درآمد مورد انتظار',s.expected,'amber',CalendarClock],['مجموع هزینه‌ها',s.totalExpense,'red',ArrowUpRight],['بدهی‌های پرداختنی',s.debts,'red',Landmark]]
  const max = Math.max(...cards.map(item => item[1]), 1)
  const hasSearch = query || tag || Object.values(filters).some(Boolean)
  return <div className="page dashboard">
    <PageHeader title="میرزا" subtitle="وضعیت حساب‌های شما در یک نگاه" logoSrc={APP_LOGO_PATH} logoAlt="لوگوی میرزا"/>
    <section ref={searchRef} className={`dashboard-search ${searchExpanded ? 'expanded' : ''}`}>
      <label className="search"><Search size={18}/><input value={query} onFocus={() => setSearchExpanded(true)} onClick={() => setSearchExpanded(true)} onChange={event => { setQuery(event.target.value); setSearchExpanded(true) }} placeholder="جستجو در همه اطلاعات"/></label>
      {searchExpanded && <div className="dashboard-search-options">
        <div className="search-options-head"><span>گزینه‌های جستجو</span><button className="icon-btn" aria-label="فیلترهای پیشرفته" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={18}/></button></div>
        <div className="tag-filter">{['', ...(data.tags || []).map(item => item.title)].map(item => <button key={item || 'all'} className={tag === item ? 'active' : ''} onClick={() => setTag(item)}>{item || 'همه تگ‌ها'}</button>)}</div>
        <p>{formatNumber(results.length)} نتیجه • مجموع <AmountDisplay value={results.reduce((sum,item)=>sum+Number(item.amount||0),0)} currency={currency}/></p>
        {hasSearch && <div className="search-results">{results.slice(0,8).map(item => <button key={`${item.kind}-${item.id}`} onClick={() => navigate(item.kind === 'بدهی' || item.kind === 'چک پرداختی' ? 'debts' : item.kind === 'هزینه جاری' ? 'currentExpenses' : 'incomes')}><strong>{item.title}</strong><span>{item.kind} • {item.category}</span></button>)}</div>}
      </div>}
    </section>
    <DashboardSummaryCards stats={s} currency={currency} navigate={navigate}/>
    {s.criticalChecks > 0 && <div className="mini-grid critical-check-grid"><button onClick={() => navigate('debts', 'بحرانی')}><CalendarClock/><span>چک‌های برگشتی و نزدیک سررسید</span><strong>{formatNumber(s.criticalChecks)}</strong></button></div>}
    <div className="section-title"><div><h2>خلاصه ماه جاری</h2><p>بر اساس اطلاعات ثبت‌شده</p></div><Badge>به‌روز</Badge></div>
    <div className="stats-grid">{cards.map(([label,value,tone,Icon]) => <article className={`stat-card ${label === 'مجموع هزینه‌ها' ? 'expense-summary-card' : ''}`} key={label}>
      <div className={`stat-icon ${tone}`}><Icon size={19}/></div>
      {label === 'مجموع هزینه‌ها' && <MiniDonut items={composition}/>}
      <span>{label}</span><AmountDisplay value={value} currency={currency}/><div className="progress"><i className={tone} style={{width:`${Math.max(8,value/max*100)}%`}}/></div>
    </article>)}</div>
    <FinancialGoals data={data} updateData={updateData} currency={currency}/>
    <AdvancedFilters open={filterOpen} filters={filters} setFilters={setFilters} data={data} onClose={() => setFilterOpen(false)}/>
  </div>
}

function DashboardSummaryCards({ stats, currency, navigate }) {
  const balance = stats.currentBalance || 0
  const cards = [
    { key: 'balance', title: 'موجودی', subtitle: 'درآمد قطعی منهای مخارج و بدهی‌های ماه', amount: balance, icon: Wallet, helper: balance === 0 ? 'برای شروع، درآمد یا هزینه ماه را ثبت کنید' : '' },
    { key: 'income', title: 'درآمدهای احتمالی', subtitle: 'جمع درآمدهای احتمالی ثبت‌شده', amount: stats.probableIncome || 0, icon: TrendingUp, helper: !stats.probableIncome ? 'هنوز درآمد احتمالی ثبت نشده' : '', action: !stats.probableIncome ? 'ثبت درآمد' : '', onAction: () => navigate('incomes') },
    { key: 'expense', title: 'هزینه ماه', subtitle: 'هزینه‌های ثبت‌شده این ماه', amount: stats.totalExpense, icon: ReceiptText, helper: stats.totalExpense === 0 ? 'هنوز هزینه‌ای برای این ماه ثبت نشده' : '', action: stats.totalExpense === 0 ? 'ثبت هزینه' : '', onAction: () => navigate('currentExpenses') },
  ]
  return <section className="dashboard-summary-cards" aria-label="خلاصه مالی">
    {cards.map(({ key, title, subtitle, amount, icon: Icon, helper, action, onAction }) => <article className={`dashboard-summary-card ${key}`} key={key}>
      <div className="summary-card-head">
        <span className="summary-card-icon"><Icon size={21}/></span>
        <div><div className="summary-title-row"><h2>{title}</h2>{action && <button type="button" onClick={onAction}>{action}</button>}</div><small>{subtitle}</small></div>
      </div>
      <AmountDisplay value={Math.abs(amount)} currency={currency}/>
      {helper && <p>{helper}</p>}
    </article>)}
  </section>
}

function AdvancedFilters({ open, filters, setFilters, data, onClose }) {
  const groups = [['نوع','type',['درآمد','بدهی','هزینه جاری','چک دریافتی','چک پرداختی']],['وضعیت','status',['پرداخت شده','پرداخت نشده','دریافت شده','دریافت نشده','عقب‌افتاده','نزدیک سررسید','برگشت‌خورده']],['دسته‌بندی','category',[...new Set([...(data.expenseCategories||[]).map(x=>x.title),...(data.incomeCategories||[]).map(x=>x.title)])]],['مخاطب مالی','contact',(data.financialContacts||[]).map(x=>x.title)],['بازه زمانی','date',['ماه جاری','ماه قبل']]]
  return <Modal open={open} title="فیلترهای پیشرفته" onClose={onClose}><div className="advanced-filter-groups">{groups.map(([label,key,options]) => <div key={key}><strong>{label}</strong><div className="tag-filter">{['',...options].map(option => <button key={option || 'all'} className={filters[key] === option ? 'active' : ''} onClick={() => setFilters({ ...filters, [key]: option })}>{option || 'همه'}</button>)}</div></div>)}</div><button className="secondary-btn clear-notifications" onClick={() => setFilters({category:'',contact:'',type:'',status:'',date:''})}>پاک کردن فیلترها</button></Modal>
}

function MiniDonut({ items }) {
  const total = items.reduce((sum,[,value])=>sum+value,0)||1
  let cursor=0
  const colors=['var(--brand)','var(--brand2)','var(--amber)','var(--info)','var(--brand-soft)']
  const gradient=items.map(([,value],index)=>{const start=cursor;cursor+=value/total*100;return `${colors[index%colors.length]} ${start}% ${cursor}%`}).join(', ')
  return <div className="summary-donut" aria-label="ترکیب هزینه‌ها" style={{background:`conic-gradient(${gradient||'#e5ece9 0 100%'})`}}/>
}

const GOAL_HORIZONS = ['تا آخر ماه', 'تا سه ماه دیگر', 'تا شش ماه دیگر', 'تا آخر سال']
const emptyGoal = () => ({ title: '', horizon: 'تا آخر ماه', amount: '', description: '' })

function goalEndDate(goal) {
  const created = goal.createdAt ? new Date(goal.createdAt) : new Date()
  const end = new Date(created)
  if (goal.horizon === 'تا آخر ماه') return new Date(currentJalaliMonthEndIso())
  if (goal.horizon === 'تا سه ماه دیگر') {
    end.setMonth(end.getMonth() + 3)
    return end
  }
  if (goal.horizon === 'تا شش ماه دیگر') {
    end.setMonth(end.getMonth() + 6)
    return end
  }
  const currentYearEnd = new Date(created.getFullYear(), 11, 31)
  return currentYearEnd
}

function goalDaysLeft(goal) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = goalEndDate(goal)
  end.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end - today) / 86400000))
}

function FinancialGoals({ data, updateData, currency }) {
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const goals = data.financialGoals || []
  const change = name => event => setEditing({ ...editing, [name]: event.target.value })
  const openEdit = goal => {
    setDetail(null)
    setEditing({ ...goal })
  }
  const save = event => {
    event.preventDefault()
    const now = new Date().toISOString()
    const item = {
      ...editing,
      amount: Number(editing.amount || 0),
      updatedAt: now,
    }
    if (!item.id) {
      item.id = crypto.randomUUID()
      item.createdAt = now
    }
    updateData(current => ({
      ...current,
      financialGoals: (current.financialGoals || []).some(goal => goal.id === item.id)
        ? current.financialGoals.map(goal => goal.id === item.id ? item : goal)
        : [item, ...(current.financialGoals || [])],
    }))
    setEditing(null)
  }
  const remove = goal => {
    if (!confirm('این هدف حذف شود؟')) return
    updateData(current => ({ ...current, financialGoals: (current.financialGoals || []).filter(item => item.id !== goal.id) }))
    setDetail(null)
  }

  return <section className="financial-goals-section">
    <div className="section-title">
      <div><h2>اهداف مالی</h2><p>برنامه‌ریزی کوتاه‌مدت و بلندمدت</p></div>
      <button className="add-btn" aria-label="افزودن" onClick={() => setEditing(emptyGoal())}><Plus size={20}/></button>
    </div>
    <div className="goal-list">
      {goals.length ? goals.map(goal => <article className="goal-card tappable" key={goal.id} onClick={() => setDetail(goal)}>
        <div className="goal-content">
          <div><span>{goal.horizon}</span><h3>{goal.title}</h3></div>
          <AmountDisplay value={goal.amount} currency={currency}/>
        </div>
        <div className="goal-countdown-badge"><strong>{formatNumber(goalDaysLeft(goal))}</strong><span>روز باقی‌مانده</span></div>
      </article>) : <div className="empty goal-empty">
        <div className="empty-illustration"><span/><i><Target size={30}/></i><b/></div>
        <strong>هنوز هدف مالی ندارید</strong>
        <span>اولین هدف مالی خود را بسازید و پیشرفت آن را با روزشمار و مبلغ مورد نیاز دنبال کنید.</span>
        <button type="button" className="primary-btn empty-action" onClick={() => setEditing(emptyGoal())}>ساخت هدف</button>
      </div>}
    </div>
    <GoalDetailSheet goal={detail} currency={currency} onClose={() => setDetail(null)} onEdit={openEdit} onDelete={remove}/>
    <Modal open={!!editing} title={`${editing?.id ? 'ویرایش' : 'افزودن'} هدف مالی`} onClose={() => setEditing(null)}>
      {editing && <form className="form-grid" onSubmit={save}>
        <Field label="عنوان هدف" value={editing.title} onChange={change('title')} required/>
        <div className="field single-choice-field"><span>بازه هدف</span><div className="single-choice-options">{GOAL_HORIZONS.map(item => <button type="button" key={item} className={editing.horizon === item ? 'active' : ''} onClick={() => setEditing({ ...editing, horizon: item })}>{item}</button>)}</div></div>
        <AmountInput label="مبلغ مورد نیاز" value={editing.amount} onChange={change('amount')} currency={currency}/>
        <Field label="توضیحات" type="textarea" value={editing.description} onChange={change('description')}/>
        <FormActions onCancel={() => setEditing(null)}/>
      </form>}
    </Modal>
  </section>
}

function GoalDetailSheet({ goal, currency, onClose, onEdit, onDelete }) {
  if (!goal) return null
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal-sheet detail-sheet" onMouseDown={event => event.stopPropagation()}>
      <header className="detail-head">
        <button className="detail-close" aria-label="بستن" onClick={onClose}><X size={18}/></button>
        <div>
          <button onClick={() => onEdit(goal)}><Pencil size={16}/> ویرایش</button>
          <button className="danger-detail" onClick={() => onDelete(goal)}><Trash2 size={16}/> حذف</button>
        </div>
      </header>
      <div className="modal-body">
        <div className="detail-hero">
          <div><span>هدف مالی</span><h2>{goal.title}</h2></div>
          <Badge>{goal.horizon}</Badge>
          <AmountDisplay value={goal.amount} currency={currency}/>
          <p>{formatNumber(goalDaysLeft(goal))} روز باقی‌مانده</p>
        </div>
        <div className="detail-list">
          <div><span>تاریخ ثبت</span><strong>{dateLabel(goal.createdAt)}</strong></div>
          <div><span>بازه هدف</span><strong>{goal.horizon}</strong></div>
          <div><span>مبلغ مورد نیاز</span><strong><AmountDisplay value={goal.amount} currency={currency}/></strong></div>
          {goal.description && <div><span>توضیحات</span><strong>{goal.description}</strong></div>}
        </div>
      </div>
    </section>
  </div>
}
