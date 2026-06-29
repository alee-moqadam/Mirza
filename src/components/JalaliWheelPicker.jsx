import { useEffect, useMemo, useRef, useState } from 'react'
import { isValidJalaaliDate } from 'jalaali-js'
import { Modal } from './UI'
import { isoToJalali } from '../helpers/dates'
import { localizeDigits, normalizeDigits } from '../utils/numberFormat'
import { useI18n } from '../i18n/I18nContext'

const pad = value => String(value).padStart(2, '0')
const parseDate = value => {
  const fallback = isoToJalali(new Date())
  const [year, month, day] = normalizeDigits(value || fallback).split('/').map(Number)
  return { year, month, day }
}

export default function JalaliWheelPicker({ open, title, value, onChange, onClose }) {
  const { t } = useI18n()
  const initial = parseDate(value)
  const [selected, setSelected] = useState(initial)

  useEffect(() => {
    if (open) setSelected(parseDate(value))
  }, [open, value])

  const currentYear = parseDate(isoToJalali(new Date())).year
  const years = useMemo(() => Array.from({ length: 21 }, (_, index) => currentYear - 10 + index), [currentYear])
  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const days = Array.from({ length: 31 }, (_, index) => index + 1).filter(day => isValidJalaaliDate(selected.year, selected.month, day))
  const choose = (key, nextValue) => setSelected(previous => {
    const next = { ...previous, [key]: nextValue }
    if (!isValidJalaaliDate(next.year, next.month, next.day)) next.day = Math.max(...Array.from({ length: 31 }, (_, index) => index + 1).filter(day => isValidJalaaliDate(next.year, next.month, day)))
    return next
  })
  const confirm = () => {
    onChange(`${selected.year}/${pad(selected.month)}/${pad(selected.day)}`)
    onClose()
  }

  return <Modal open={open} title={title} onClose={onClose}>
    <div className="ios-date-picker">
      <div className="wheel-selection"/>
      <Wheel label="سال" values={years} selected={selected.year} onChange={value => choose('year', value)}/>
      <Wheel label="ماه" values={months} selected={selected.month} onChange={value => choose('month', value)}/>
      <Wheel label="روز" values={days} selected={selected.day} onChange={value => choose('day', value)}/>
    </div>
    <button type="button" className="primary-btn date-picker-confirm" onClick={confirm}>{t('تأیید تاریخ')}</button>
  </Modal>
}

function Wheel({ label, values, selected, onChange }) {
  const activeRef = useRef(null)
  const scrollRef = useRef(null)
  const frameRef = useRef(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [selected, values])
  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const syncSelectedWithCenter = () => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const element = scrollRef.current
      if (!element) return
      const itemHeight = 44
      const index = Math.min(values.length - 1, Math.max(0, Math.round(element.scrollTop / itemHeight)))
      const centeredValue = values[index]
      if (centeredValue !== undefined && centeredValue !== selected) onChange(centeredValue)
    })
  }

  return <div className="wheel-column">
    <span>{label}</span>
    <div className="wheel-scroll" ref={scrollRef} onScroll={syncSelectedWithCenter}>
      {values.map(value => <button type="button" key={value} ref={selected === value ? activeRef : null} className={selected === value ? 'active' : ''} onClick={() => onChange(value)}>{localizeDigits(String(value))}</button>)}
    </div>
  </div>
}
