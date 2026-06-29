import { Bell } from 'lucide-react'

export default function FloatingNotifications({ notifications, onClick }) {
  const unread = notifications.filter(item => !item.read).length
  if (!unread) return null
  return <button className="floating-notifications" aria-label="اعلان‌ها" onClick={onClick}><Bell size={20}/><i>{unread}</i></button>
}
