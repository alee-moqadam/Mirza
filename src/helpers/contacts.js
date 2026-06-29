export function maskSensitive(value, type) {
  if (!value) return 'ثبت نشده'
  return type === 'iban'
    ? `${value.slice(0, 4)} **** **** **** ${value.slice(-4)}`
    : `${value.slice(0, 4)} **** **** ${value.slice(-4)}`
}

export function contactDetails(contact) {
  const accounts = contact.bankAccounts?.length ? contact.bankAccounts : [{ bank: contact.bank, account: contact.account, card: contact.card, iban: contact.iban }]
  return {
    نام: contact.title,
    عنوان: contact.relationTitle,
    موبایل: contact.mobile,
    'حساب‌های بانکی': accounts.map((item, index) => `${index + 1}. ${item.bank || 'بدون بانک'} | حساب: ${item.account || 'ثبت نشده'} | کارت: ${item.card || 'ثبت نشده'} | شبا: ${item.iban || 'ثبت نشده'}`).join('\n'),
    'کد ملی': contact.nationalId,
    توضیحات: contact.description,
  }
}
