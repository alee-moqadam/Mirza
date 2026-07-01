import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import RecordsPage from './pages/RecordsPage'
import Settings from './pages/Settings'
import TrashPage from './pages/TrashPage'
import FloatingNotifications from './components/FloatingNotifications'
import NotificationsSheet from './components/NotificationsSheet'
import LockScreen from './components/LockScreen'
import SplashScreen from './components/SplashScreen'
import { useAppLock } from './hooks/useAppLock'
import { useFinanceData } from './hooks/useFinanceData'
import { I18nProvider, useI18n } from './i18n/I18nContext'
import { setDigitStyle } from './utils/numberFormat'
import { clearSectionUnseen, getAffectedNavSections, markSectionsUnseen } from './helpers/navNotifications'

const validAccent = accent => ['mint', 'rose', 'lavender'].includes(accent) ? accent : 'mint'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [pageFilter, setPageFilter] = useState('همه')
  const { data, updateData, resetData } = useFinanceData()
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
    <AppContent page={page} setPage={setPage} pageFilter={pageFilter} setPageFilter={setPageFilter} data={data} updateData={updateData} resetData={resetData}/>
  </I18nProvider>
}

function AppContent({ page, setPage, pageFilter, setPageFilter, data, updateData, resetData }) {
  const { language, direction, t } = useI18n()
  const requestedTheme = data.theme || 'light'
  const resolvedTheme = requestedTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : requestedTheme === 'system' ? 'light' : requestedTheme
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unseenSections, setUnseenSections] = useState({})
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
  const navigateBackFromTrash = () => {
    const target = ['debts', 'incomes', 'currentExpenses'].includes(pageFilter) ? pageFilter : 'settings'
    navigate(target)
  }
  useEffect(() => {
    setUnseenSections(current => clearSectionUnseen(current, page))
  }, [page])
  const updateDataWithNavMarkers = updater => {
    const updated = updateData(updater)
    const affectedSections = getAffectedNavSections(data, updated)
    if (affectedSections.length) {
      setUnseenSections(current => markSectionsUnseen(current, affectedSections, page))
    }
    return updated
  }
  if (showSplash) return <SplashScreen />
  if (lock.locked) return <LockScreen data={data} lock={lock}/>
  return <div className={`app-shell lang-${language} dir-${direction} digits-${data.digitStyle || 'en'} theme-${resolvedTheme} accent-${validAccent(data.accent)} font-${data.fontSize || 'normal'}`} dir={direction}>
    <main>
      {page === 'dashboard' && <Dashboard data={data} updateData={updateDataWithNavMarkers} navigate={navigate}/>}
      {page === 'currentExpenses' && <RecordsPage type="currentExpenses" data={data} updateData={updateDataWithNavMarkers} navigate={navigate}/>}
      {page === 'incomes' && <RecordsPage type="incomes" data={data} updateData={updateDataWithNavMarkers} navigate={navigate}/>}
      {page === 'debts' && <RecordsPage key={`debts-${pageFilter}`} type="debts" initialFilter={pageFilter} data={data} updateData={updateDataWithNavMarkers} navigate={navigate}/>}
      {page === 'trash' && <TrashPage data={data} updateData={updateDataWithNavMarkers} initialType={pageFilter} onBack={navigateBackFromTrash}/>}
      {page === 'settings' && <Settings data={data} updateData={updateDataWithNavMarkers} navigate={navigate} onReset={() => confirm(t('داده‌ها به حالت نمونه بازگردد؟')) && resetData()}/>}
    </main>
    <BottomNav active={page} onChange={nextPage => navigate(nextPage)} unseenSections={unseenSections}/>
    <FloatingNotifications notifications={data.notifications || []} onClick={() => setNotificationsOpen(true)}/>
    <NotificationsSheet open={notificationsOpen} data={data} updateData={updateDataWithNavMarkers} onClose={() => setNotificationsOpen(false)}/>
  </div>
}
