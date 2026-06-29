const now = new Date()
const iso = (offset = 0) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const stamp = now.toISOString()

export const sampleData = {
  appDataVersion: 3,
  currency: 'تومان',
  language: 'fa',
  digitStyle: 'en',
  theme: 'light',
  accent: 'mint',
  fontSize: 'normal',
  profile: { name: 'کاربر میرزا', role: 'میرزا', mobile: '', email: '', bio: 'برای آینده مالی بهتر برنامه‌ریزی می‌کنم.' },
  banks: [
    { id: 'bank-1', title: 'بانک شهر', hasCheckbook: true, createdAt: stamp, updatedAt: stamp },
    { id: 'bank-2', title: 'بانک پاسارگاد', hasCheckbook: false, createdAt: stamp, updatedAt: stamp },
  ],
  expenseCategories: ['مسکن', 'قبوض', 'بیمه', 'خرید', 'حمل‌ونقل'].map((title, i) => ({ id: `ec-${i}`, title, createdAt: stamp, updatedAt: stamp })),
  incomeCategories: ['حقوق', 'پروژه', 'سرمایه‌گذاری', 'اجاره'].map((title, i) => ({ id: `ic-${i}`, title, createdAt: stamp, updatedAt: stamp })),
  tags: ['ثابت', 'مهم', 'کاری', 'ماهانه'].map((title, i) => ({ id: `tag-${i}`, title, createdAt: stamp, updatedAt: stamp })),
  financialContacts: [
    { id: 'c1', title: 'صاحب‌خانه', relationTitle: 'صاحب‌خانه', type: 'شخصی', mobile: '09121234567', bank: 'بانک شهر', card: '6037997512341234', iban: 'IR120570000000123456789001', account: '12345678', bankAccounts: [{ id: 'c1-b1', bank: 'بانک شهر', card: '6037997512341234', iban: 'IR120570000000123456789001', account: '12345678' }], nationalId: '0012345678', description: 'مخاطب اجاره', createdAt: stamp, updatedAt: stamp },
    { id: 'c2', title: 'مشتری پروژه', relationTitle: 'همکار', type: 'کاری', mobile: '09125556677', bank: 'بانک پاسارگاد', card: '5022291012345678', iban: 'IR450570000000987654321001', account: '98765432', bankAccounts: [{ id: 'c2-b1', bank: 'بانک پاسارگاد', card: '5022291012345678', iban: 'IR450570000000987654321001', account: '98765432' }], nationalId: '', description: '', createdAt: stamp, updatedAt: stamp },
    { id: 'c3', title: 'بانک پاسارگاد', relationTitle: 'بانک', type: 'بانکی', mobile: '', bank: 'بانک پاسارگاد', card: '', iban: '', account: '', nationalId: '', description: '', createdAt: stamp, updatedAt: stamp },
    { id: 'c4', title: 'بانک شهر', relationTitle: 'بانک', type: 'بانکی', mobile: '', bank: 'بانک شهر', card: '', iban: '', account: '', nationalId: '', description: '', createdAt: stamp, updatedAt: stamp },
  ],
  expenses: [
    { id: 'e1', title: 'اجاره خانه', amount: 25000000, startDate: iso(-90), endDate: '', dueDate: iso(2), recurrence: 'ماهانه', category: 'مسکن', contact: 'صاحب‌خانه', description: 'اجاره ماه جاری', endless: true, paidCount: 3, totalCount: 12, status: 'پرداخت نشده', createdAt: stamp, updatedAt: stamp },
    { id: 'e2', title: 'اینترنت', amount: 650000, startDate: iso(-30), endDate: '', dueDate: iso(-4), recurrence: 'ماهانه', category: 'قبوض', contact: '', description: '', endless: true, paidCount: 0, totalCount: 1, status: 'پرداخت نشده', createdAt: stamp, updatedAt: stamp },
    { id: 'e3', title: 'بیمه', amount: 4800000, startDate: iso(-50), endDate: iso(180), dueDate: iso(14), recurrence: 'سه‌ماهه', category: 'بیمه', contact: '', description: '', endless: false, paidCount: 1, totalCount: 4, status: 'پرداخت نشده', createdAt: stamp, updatedAt: stamp },
    { id: 'e4', title: 'خرید ماهانه', amount: 7200000, startDate: iso(-10), endDate: '', dueDate: iso(8), recurrence: 'ماهانه', category: 'خرید', contact: '', description: '', endless: true, paidCount: 0, totalCount: 1, status: 'پرداخت نشده', createdAt: stamp, updatedAt: stamp },
    { id: 'e5', title: 'قسط خودرو', amount: 12500000, startDate: iso(-120), endDate: iso(240), dueDate: iso(5), recurrence: 'ماهانه', category: 'حمل‌ونقل', contact: '', description: '', endless: false, paidCount: 4, totalCount: 12, status: 'پرداخت نشده', createdAt: stamp, updatedAt: stamp },
  ],
  incomes: [
    { id: 'i1', title: 'حقوق ماهانه', incomeType: 'ماهیانه', amount: 48000000, receivedAmount: 48000000, startDate: iso(-60), endDate: '', dueDate: iso(-2), recurrence: 'ماهانه', certainty: 'قطعی', status: 'دریافت شده', category: 'حقوق', source: 'شرکت', contact: '', tags: ['ثابت', 'ماهانه'], description: '', endless: true, createdAt: stamp, updatedAt: stamp },
    { id: 'i2', title: 'پروژه طراحی سایت', incomeType: 'مقطعی / موردی', amount: 30000000, receivedAmount: 10000000, startDate: iso(-20), endDate: iso(25), dueDate: iso(10), recurrence: 'فقط یک‌بار', certainty: 'قطعی', status: 'دریافت ناقص', category: 'پروژه', source: 'مشتری پروژه', contact: 'مشتری پروژه', tags: ['کاری', 'مهم'], description: '', endless: false, createdAt: stamp, updatedAt: stamp },
    { id: 'i3', title: 'سود سرمایه‌گذاری', incomeType: 'دوره‌ای سفارشی', amount: 8000000, receivedAmount: 0, startDate: iso(-30), endDate: '', dueDate: iso(20), recurrence: 'سه‌ماهه', certainty: 'احتمالی', status: 'دریافت نشده', category: 'سرمایه‌گذاری', source: 'صندوق سرمایه‌گذاری', contact: '', tags: ['مهم'], description: '', endless: true, createdAt: stamp, updatedAt: stamp },
    { id: 'i4', title: 'اجاره دریافتی', incomeType: 'ماهیانه', amount: 15000000, receivedAmount: 0, startDate: iso(-30), endDate: '', dueDate: iso(4), recurrence: 'ماهانه', certainty: 'قطعی', status: 'دریافت نشده', category: 'اجاره', source: 'مستأجر', contact: '', tags: ['ثابت'], description: '', endless: true, createdAt: stamp, updatedAt: stamp },
  ],
  checksAndDebts: [
    { id: 'd1', person: 'فروشنده خودرو', relation: 'پرداختنی', title: 'چک پرداختنی بانک شهر', amount: 18000000, dueDate: iso(3), description: '', isCheck: true, checkNumber: '124587', bank: 'بانک شهر', status: 'نزدیک سررسید', recurrence: 'فقط یک‌بار', createdAt: stamp, updatedAt: stamp },
    { id: 'd2', person: 'مشتری پروژه', relation: 'دریافتنی', title: 'چک دریافتی بانک پاسارگاد', amount: 22000000, dueDate: iso(8), description: '', isCheck: true, checkNumber: '887411', bank: 'بانک پاسارگاد', status: 'فعال', recurrence: 'فقط یک‌بار', createdAt: stamp, updatedAt: stamp },
    { id: 'd3', person: 'علی رضایی', relation: 'پرداختنی', title: 'بدهی پرداختنی به یک شخص', amount: 7000000, dueDate: iso(-6), description: '', isCheck: false, status: 'عقب‌افتاده', recurrence: 'فقط یک‌بار', createdAt: stamp, updatedAt: stamp },
    { id: 'd4', person: 'شرکت آفتاب', relation: 'دریافتنی', title: 'طلب دریافتنی از مشتری', amount: 12500000, dueDate: iso(18), description: '', isCheck: false, status: 'فعال', recurrence: 'فقط یک‌بار', createdAt: stamp, updatedAt: stamp },
  ],
  histories: [],
  debts: [],
  currentExpenses: [
    { id: 'ce1', title: 'خرید روزانه', amount: 850000, expenseDate: iso(-1), dueDate: iso(-1), category: 'خرید', tags: ['روزانه'], contacts: [], paymentMethod: 'کارت بانکی', description: '', status: 'پرداخت شده', createdAt: stamp, updatedAt: stamp },
    { id: 'ce2', title: 'تاکسی اینترنتی', amount: 240000, expenseDate: iso(-3), dueDate: iso(-3), category: 'حمل‌ونقل', tags: [], contacts: [], paymentMethod: 'کارت بانکی', description: '', status: 'پرداخت شده', createdAt: stamp, updatedAt: stamp },
  ],
  financialGoals: [
    { id: 'goal-1', title: 'صندوق اضطراری', horizon: 'تا شش ماه دیگر', amount: 120000000, description: 'هدف برای پوشش هزینه‌های ضروری در شرایط پیش‌بینی‌نشده', createdAt: stamp, updatedAt: stamp },
    { id: 'goal-2', title: 'خرید لپ‌تاپ کاری', horizon: 'تا سه ماه دیگر', amount: 85000000, description: 'برای افزایش بهره‌وری کارهای طراحی و توسعه', createdAt: stamp, updatedAt: stamp },
    { id: 'goal-3', title: 'بودجه پایان سال', horizon: 'تا آخر سال', amount: 220000000, description: 'هدف برای هزینه‌های پایان سال و برنامه‌های خانوادگی', createdAt: stamp, updatedAt: stamp },
    { id: 'goal-4', title: 'بودجه سفر خانوادگی', horizon: 'تا آخر ماه', amount: 45000000, description: 'هدف کوتاه‌مدت برای سفر آخر ماه', createdAt: stamp, updatedAt: stamp },
  ],
  financialGoalsSeeded: true,
  notifications: [],
  notificationSettings: { enabled: false, sentIds: [] },
  lockSettings: { enabled: false, passcodeHash: '', autoLock: 'فوری', biometricCredentialId: '' },
}
