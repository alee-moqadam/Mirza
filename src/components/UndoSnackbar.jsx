import { useI18n } from '../i18n/I18nContext'
export default function UndoSnackbar({ pending, onUndo }) {
  const { t } = useI18n()
  if (!pending) return null
  return <aside className="undo-snackbar" key={pending.key}>
    <div><strong>{t(pending.message)}</strong><span>{t('انتقال به تاریخچه تا 5 ثانیه دیگر')}</span><i /></div>
    <button onClick={onUndo}>{t('بازگشت')}</button>
  </aside>
}
