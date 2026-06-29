import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import RecordsPage from './pages/RecordsPage'
import Settings from './pages/Settings'
import FloatingNotifications from './components/FloatingNotifications'
import NotificationsSheet from './components/NotificationsSheet'
import LockScreen from './components/LockScreen'
import SplashScreen from './components/SplashScreen'
import { useAppLock } from './hooks/useAppLock'
import { useFinanceData } from './hooks/useFinanceData'
import { I18nProvider, useI18n } from './i18n/I18nContext'
import { setDigitStyle } from './utils/numberFormat'

const validAccent = accent => ['mint', 'rose', 'lavender'].includes(accent) ? accent : 'mint'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [pageFilter, setPageFilter] = useState('همه')
  const { data, alertCount, updateData, resetData } = useFinanceData()
  const language = data.language || 'fa'
  const digitStyle = data.digitStyle || 'en'
  const requestedTheme = data.theme || 'light'
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const resolvedTheme = requestedTheme === 'system' ? (systemDark ? 'dark' : 'light') : requestedTheme
  setDigitStyle(digitStyle)

  useEffect(() => {
    const direction = ['fa', 'ar'].includes(language) ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.body.className = `lang-${language} dir-${direction} digits-${digitStyle} theme-${resolvedTheme} accent-${validAccent(data.accent)} font-${data.fontSize || 'normal'}`
  }, [language, digitStyle, resolvedTheme, data.accent, data.fontSize])

  return <I18nProvider language={language}>
    <AppContent page={page} setPage={setPage} pageFilter={pageFilter} setPageFilter={setPageFilter} data={data} alertCount={alertCount} updateData={updateData} resetData={resetData}/>
  </I18nProvider>
}

function AppContent({ page, setPage, pageFilter, setPageFilter, data, alertCount, updateData, resetData }) {
  const { language, direction, t } = useI18n()
  const requestedTheme = data.theme || 'light'
  const resolvedTheme = requestedTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : requestedTheme === 'system' ? 'light' : requestedTheme
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const lock = useAppLock(data.lockSettings)
  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1400)
    return () => window.clearTimeout(timer)
  }, [])
  const navigate = (nextPage, filter = 'همه') => {
    setPageFilter(filter)
    setPage(nextPage)
  }
  if (showSplash) return <SplashScreen />
  if (lock.locked) return <LockScreen data={data} lock={lock}/>
  return <div className={`app-shell lang-${language} dir-${direction} digits-${data.digitStyle || 'en'} theme-${resolvedTheme} accent-${validAccent(data.accent)} font-${data.fontSize || 'normal'}`} dir={direction}>
    <main>
      {page === 'dashboard' && <Dashboard data={data} updateData={updateData} navigate={navigate}/>}
      {page === 'currentExpenses' && <RecordsPage type="currentExpenses" data={data} updateData={updateData}/>}
      {page === 'incomes' && <RecordsPage type="incomes" data={data} updateData={updateData}/>}
      {page === 'debts' && <RecordsPage key={`debts-${pageFilter}`} type="debts" initialFilter={pageFilter} data={data} updateData={updateData}/>}
      {page === 'settings' && <Settings data={data} updateData={updateData} onReset={() => confirm(t('داده‌ها به حالت نمونه بازگردد؟')) && resetData()}/>}
    </main>
    <BottomNav active={page} onChange={nextPage => navigate(nextPage)} alertCount={alertCount}/>
    <FloatingNotifications notifications={data.notifications || []} onClick={() => setNotificationsOpen(true)}/>
    <NotificationsSheet open={notificationsOpen} data={data} updateData={updateData} onClose={() => setNotificationsOpen(false)}/>
  </div>
}
