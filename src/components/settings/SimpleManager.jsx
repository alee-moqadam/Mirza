import { ManageRow } from '../UI'

export default function SimpleManager({ title, type, rows, onAdd, onDelete }) {
  return <section className="settings-section">
    <div className="manage-list">{rows.map(item => <ManageRow key={item.id} title={item.title} onEdit={() => onAdd(type, item)} onDelete={() => onDelete(type, item.id)} />)}</div>
  </section>
}
