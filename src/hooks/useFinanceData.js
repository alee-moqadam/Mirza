import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { daysUntil, isNearDue, isOverdue } from '../helpers/dates'
import { SETTLED_STATUSES } from '../constants/records'
import { readFinanceData, restoreSampleData, writeFinanceData } from '../services/storage/storageRepository'
import { createFinanceDataController } from '../services/financeDataController'

export function useFinanceData() {
  const [data, setData] = useState(() => readFinanceData())
  const controllerRef = useRef(null)
  if (!controllerRef.current) {
    controllerRef.current = createFinanceDataController({
      read: readFinanceData,
      write: writeFinanceData,
      restore: restoreSampleData,
      initialData: data,
      onChange: setData,
      onError: error => console.error('Failed to update finance data:', error),
    })
  }

  useEffect(() => {
    const refreshFromStorage = event => {
      if (event.storageArea && event.storageArea !== localStorage) return
      controllerRef.current.refreshData()
    }
    window.addEventListener('storage', refreshFromStorage)
    window.addEventListener('mirza:data-changed', refreshFromStorage)
    return () => {
      window.removeEventListener('storage', refreshFromStorage)
      window.removeEventListener('mirza:data-changed', refreshFromStorage)
    }
  }, [])

  const refreshData = useCallback(() => controllerRef.current.refreshData(), [])
  const updateData = useCallback(updater => {
    const previousVersion = controllerRef.current.getVersion()
    const updated = controllerRef.current.mutateData(updater)
    if (controllerRef.current.getVersion() !== previousVersion) window.dispatchEvent(new Event('mirza:data-changed'))
    return updated
  }, [])
  const resetData = useCallback(() => {
    const previousVersion = controllerRef.current.getVersion()
    const restored = controllerRef.current.resetData()
    if (controllerRef.current.getVersion() !== previousVersion) window.dispatchEvent(new Event('mirza:data-changed'))
    return restored
  }, [])

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
    updateData(current => ({ ...current, notifications: [...created, ...(current.notifications || [])], notificationSettings: { ...current.notificationSettings, sentIds: [...sent, ...candidates.map(({ notificationId }) => notificationId)] } }))
  }, [data.debts, data.notificationSettings?.enabled, updateData])

  const alertCount = useMemo(() => (data.debts || []).filter(item =>
    (isNearDue(item) || isOverdue(item) || item.status === 'برگشت‌خورده') &&
    !SETTLED_STATUSES.includes(item.status)
  ).length, [data.debts])

  return { data, alertCount, updateData, resetData, refreshData }
}
