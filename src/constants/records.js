export const RECURRENCE_OPTIONS = ['ماهانه', 'دوماهه', 'سه‌ماهه', 'شش‌ماهه', 'سالانه']
export const INCOME_RECURRENCE_OPTIONS = ['ماهانه', 'دوماهه', 'سه‌ماهه', 'شش‌ماهه', 'سالانه']

const expenseFields = [
  ['عنوان هزینه', 'title'], ['مبلغ', 'amount', 'amount'], ['تاریخ شروع', 'startDate', 'jalaliDate'],
  ['دوره پرداخت', 'recurrence', 'recurrenceGroup', RECURRENCE_OPTIONS],
  ['دسته‌بندی', 'category', 'category'], ['مخاطب مالی مرتبط', 'contacts', 'contacts'], ['توضیحات', 'description', 'textarea'],
]

const incomeFields = [
  ['عنوان درآمد', 'title'], ['مبلغ کل', 'amount', 'amount'], ['تاریخ شروع', 'startDate', 'jalaliDate'],
  ['دوره تکرار', 'recurrence', 'recurrenceGroup', INCOME_RECURRENCE_OPTIONS],
  ['دسته‌بندی درآمد', 'category', 'category'], ['مخاطب مالی مرتبط', 'contacts', 'contacts'],
  ['تگ‌ها', 'tags', 'tags'],
  ['اطلاعات اضافی', 'additional', 'additional'],
]

const debtFields = [
  ['مبلغ', 'amount', 'amount'], ['تاریخ سررسید', 'dueDate', 'jalaliDate'],
  ['دوره پرداخت', 'recurrence', 'recurrenceGroup', RECURRENCE_OPTIONS],
  ['تگ‌ها', 'tags', 'tags'], ['کد ملی، اختیاری', 'nationalId'], ['شماره موبایل طرف', 'mobile'],
  ['توضیحات', 'description', 'textarea'],
]
const currentExpenseFields = [
  ['عنوان هزینه', 'title'], ['مبلغ', 'amount', 'amount'], ['تاریخ هزینه', 'expenseDate', 'jalaliDate'],
  ['دسته‌بندی', 'category', 'category'], ['تگ‌ها', 'tags', 'tags'], ['مخاطب مالی، اختیاری', 'contacts', 'contacts'],
  ['روش پرداخت، اختیاری', 'paymentMethod', 'select', ['کارت بانکی', 'نقدی', 'انتقال بانکی', 'سایر']], ['توضیحات', 'description', 'textarea'],
]

export const RECORD_DEFAULTS = {
  expenses: { title: '', amount: '', startDate: '', dueDate: '', recurrence: 'ماهانه', category: '', contact: '', contacts: [], description: '', endless: false, status: 'پرداخت نشده', paidCount: 0, totalCount: 1 },
  incomes: { title: '', incomeType: 'فقط یک‌بار', amount: '', receivedAmount: 0, startDate: '', dueDate: '', recurrence: 'فقط یک‌بار', isPeriodic: false, loanDurationMonths: '', certainty: 'قطعی', status: 'دریافت نشده', category: '', contact: '', contacts: [], tags: [], description: '', endless: false },
  debts: { person: '', relation: 'پرداختنی', direction: 'payable', title: '', amount: '', startDate: '', dueDate: '', endDate: '', description: '', nationalId: '', mobile: '', account: '', iban: '', card: '', checkAccountMode: 'card', contact: '', contacts: [], paymentAccountId: '', tags: [], isCheck: false, isPeriodic: false, isLoan: false, loanStartDate: '', loanDurationMonths: '', interestRate: '', loanBank: '', loanTotalAmount: '', checkNumber: '', checkItems: [], bank: 'بانک شهر', receiverBank: '', issuerBank: '', recurrence: 'فقط یک‌بار', endless: false, status: 'فعال' },
  currentExpenses: { title: '', amount: '', expenseDate: '', dueDate: '', category: '', tags: [], contacts: [], paymentMethod: '', description: '', status: 'پرداخت شده' },
}

export const RECORD_CONFIG = {
  expenses: { title: 'هزینه‌ها', eyebrow: 'مدیریت پرداخت‌ها', fields: expenseFields, filters: ['همه', 'پرداخت شده', 'پرداخت نشده', 'عقب‌افتاده', 'نزدیک سررسید'] },
  incomes: { title: 'درآمدها', eyebrow: 'مدیریت دریافتی‌ها', fields: incomeFields, filters: ['همه', 'دریافت شده', 'دریافت نشده', 'دریافت ناقص', 'عقب‌افتاده'] },
  debts: { title: 'بدهی‌ها', eyebrow: 'تعهدات و پرداخت‌های آینده', fields: debtFields, filters: ['همه', 'بحرانی', 'نزدیک سررسید', 'عقب‌افتاده', 'برگشت‌خورده'] },
  currentExpenses: { title: 'هزینه‌های جاری', eyebrow: 'هزینه‌های پرداخت‌شده', fields: currentExpenseFields, filters: ['همه', 'پرداخت شده'] },
}

export const SETTLED_STATUSES = ['پرداخت شده', 'دریافت شده', 'تسویه‌شده']
