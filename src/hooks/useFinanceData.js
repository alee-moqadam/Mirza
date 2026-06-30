import { useEffect, useMemo, useState } from 'react'
import { daysUntil, isNearDue, isOverdue } from '../helpers/dates'
import { SETTLED_STATUSES } from '../constants/records'
import { readFinanceData, restoreSampleData, writeFinanceData } from '../services/storage/storageRepository'

export function useFinanceData() {
  const [data, setData] = useState(readFinanceData)

  useEffect(() => {
  Promise.resolve(writeFinanceData(data)).catch((error) => {
    console.error('Failed to write finance data:', error)
  })
}, [data])
  useEffect(() => {
    const sent = new Set(data.notificationSettings?.sentIds || [])
    const candidates = (data.debts || []).flatMap(item => {
      if (SETTLED_STATUSES.includes(item.status)) return []
      const type = item.status === 'برگشت‌خورده' ? 'bounced check' : daysUntil(item.dueDate) < -1 ? 'overdue debt' : item.isCheck && isNearDue(item) ? 'near due check' : ''
      const notificationId = `${type}:${item.id}`
      return type && !sent.has(notificationId) ? [{ item, type, notificationId }] : []
    })
    if (!candidates.length) return
    const created = candidates.map(({ item, type }) => ({ id: crypto.randomUUID(), title: type === 'bounced check' ? 'چک برگشتی' : type === 'near due check' ? 'چک نزدیک سررسید' : 'بدهی عقب‌افتاده', body: `${item.title} نیازمند بررسی است.`, type, relatedItemId: item.id, relatedItemType: 'debts', createdAt: new Date().toISOString(), read: false }))
    if (data.notificationSettings?.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') candidates.filter(({ type }) => type === 'overdue debt').forEach(({ item }) => new Notification('بدهی عقب‌افتاده', { body: `${item.title} از موعد پرداخت گذشته است.` }))
    setData(current => ({ ...current, notifications: [...created, ...(current.notifications || [])], notificationSettings: { ...current.notificationSettings, sentIds: [...sent, ...candidates.map(({ notificationId }) => notificationId)] } }))
  }, [data.debts, data.notificationSettings?.enabled])

  const alertCount = useMemo(() => (data.debts || []).filter(item =>
    (isNearDue(item) || isOverdue(item) || item.status === 'برگشت‌خورده') &&
    !SETTLED_STATUSES.includes(item.status)
  ).length, [data.debts])

  const updateData = (updater) => setData(previous => updater(previous))
  const resetData = () => setData(restoreSampleData())

  return { data, alertCount, updateData, resetData }
}
