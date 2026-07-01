import { LayoutDashboard, ReceiptText, WalletCards, Landmark, Settings } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

const items = [
  ['dashboard','داشبورد',LayoutDashboard],['debts','بدهی‌ها',Landmark],
  ['currentExpenses','هزینه‌های جاری',ReceiptText],['incomes','درآمدها',WalletCards],['settings','تنظیمات',Settings],
]
export default function BottomNav({ active, onChange, unseenSections = {} }) {
  const { t } = useI18n()
  return <nav className="bottom-nav">{items.map(([id,label,Icon]) => <button key={id} className={active===id?'active':''} onClick={()=>onChange(id)}>
    <span className="nav-icon"><Icon size={21}/>{unseenSections[id] && <i aria-hidden="true" />}</span><span>{t(label)}</span>
  </button>)}</nav>
}
