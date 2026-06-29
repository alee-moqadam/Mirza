import { createContext, useContext } from 'react'
import { RTL_LANGUAGES, translations } from './translations'

const I18nContext = createContext({ language: 'fa', direction: 'rtl', t: value => value })
const ALIASES = {
  'تاریخ پایان، اختیاری': 'تاریخ پایان', 'کد ملی، اختیاری': 'کد ملی', 'نام بانک چک': 'نام بانک',
  'عنوان هزینه': 'عنوان', 'عنوان درآمد': 'عنوان', 'موضوع بدهی یا چک': 'عنوان',
  'مبلغ کل': 'مبلغ', 'مبلغ دریافت‌شده': 'مبلغ', 'تاریخ سررسید / اولین پرداخت': 'تاریخ سررسید',
  'تاریخ دریافت / سررسید دریافت': 'تاریخ سررسید', 'دسته‌بندی درآمد': 'دسته‌بندی',
  'مخاطب مالی مرتبط': 'مخاطب مالی', 'انتخاب از مخاطبین مالی': 'مخاطب مالی',
  'تگ‌ها (با ویرگول جدا کنید)': 'تگ‌ها', 'نام شخص / سازمان': 'نام فرد',
}

export function I18nProvider({ language = 'fa', children }) {
  const direction = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'
  const t = key => translations[language]?.[key] || translations[language]?.[ALIASES[key]] || key
  return <I18nContext.Provider value={{ language, direction, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
