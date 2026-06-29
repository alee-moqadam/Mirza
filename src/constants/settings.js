export const SETTINGS_TABS = ['مخاطبین مالی', 'بانک‌ها', 'دسته‌بندی‌ها', 'تگ‌ها', 'واحد پول', 'زبان برنامه', 'نمایش اعداد']
export const CURRENCY_OPTIONS = ['تومان', 'ریال', 'یورو', 'دلار']
export const CONTACT_TYPES = ['شخصی', 'بانکی', 'کاری', 'خانوادگی', 'فروشنده', 'طلبکار', 'بدهکار', 'سازمان / شرکت']
export const CONTACT_DEFAULT = { title: '', relationTitle: '', mobile: '', bank: '', account: '', card: '', iban: '', bankAccounts: [{ id: 'primary', bank: '', account: '', card: '', iban: '' }], nationalId: '', description: '', type: 'شخصی' }
export const SETTINGS_ENTITY_TITLES = { banks: 'بانک‌ها', expenseCategories: 'دسته‌بندی هزینه', incomeCategories: 'دسته‌بندی درآمد', tags: 'تگ‌ها' }
export const THEME_OPTIONS = [
  { code: 'light', label: 'روشن', description: 'ظاهر روشن و شفاف' },
  { code: 'dark', label: 'تیره', description: 'مناسب محیط‌های کم‌نور' },
  { code: 'system', label: 'سیستم', description: 'هماهنگ با تنظیمات دستگاه' },
]
export const ACCENT_OPTIONS = [
  { code: 'mint', label: 'Royal Emerald', primary: '#2F7D6B', secondary: '#5FAE9C', accent: '#EAF7F3', surface: '#F7FCFA', text: '#123524' },
  { code: 'rose', label: 'Royal Rose', primary: '#D987A3', secondary: '#EAB9CA', accent: '#FFF4F7', surface: '#FFFAFB', text: '#3A1823' },
  { code: 'lavender', label: 'Royal Lavender', primary: '#8E7BEF', secondary: '#B6A7F8', accent: '#F5F3FF', surface: '#FBFAFF', text: '#241A3A' },
]
