import { Modal } from './UI'
import RecordDetailSheet from './RecordDetailSheet'
import { useState } from 'react'

export default function NotificationsSheet({ open, data, updateData, onClose }) {
  const [detail, setDetail] = useState(null)
  const notifications = data.notifications || []
  const markRead = id => updateData(current => ({ ...current, notifications: current.notifications.map(item => item.id === id ? { ...item, read: true } : item) }))
  const clear = () => updateData(current => ({ ...current, notifications: [] }))
  const findRelated = notification => {
    const candidates = [
      ['debts', ...(data.debts || [])],
      ['incomes', ...(data.incomes || [])],
      ['currentExpenses', ...(data.currentExpenses || [])],
    ]
    for (const [type, ...items] of candidates) {
      const item = items.find(record => record.id === notification.relatedItemId)
      if (item) return { type, item }
    }
    return null
  }
  const openNotification = notification => {
    markRead(notification.id)
    const related = findRelated(notification)
    if (related) setDetail(related)
  }
  return <Modal open={open} title="اعلان‌ها" onClose={onClose}>
    <div className="notification-list">
      {notifications.length ? notifications.map(item => <button key={item.id} className={item.read ? '' : 'unread'} onClick={() => openNotification(item)}><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleString('fa-IR')}</small></button>) : <p>اعلان جدیدی وجود ندارد.</p>}
    </div>
    {!!notifications.length && <button className="secondary-btn clear-notifications" onClick={clear}>پاک کردن همه</button>}
    <RecordDetailSheet item={detail?.item} type={detail?.type} currency={data.currency || 'تومان'} onClose={() => setDetail(null)}/>
  </Modal>
}
