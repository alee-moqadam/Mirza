export const BANK_CATALOG = [
  { title: 'بانک ایران زمین', icon: '/bank-icons/iran-Zamin.svg' },
  { title: 'بانک ملی', icon: '/bank-icons/Melli.svg' },
  { title: 'بانک مرکزی', icon: '/bank-icons/Markazi.svg' },
  { title: 'مؤسسه ملل', icon: '/bank-icons/Melal.svg' },
  { title: 'بانک پاسارگاد', icon: '/bank-icons/Pasargad.svg' },
  { title: 'بانک شهر', icon: '/bank-icons/Shahr.svg' },
  { title: 'بانک سپه', icon: '/bank-icons/Sepah.svg' },
  { title: 'بانک سامان', icon: '/bank-icons/Saman.svg' },
  { title: 'پست بانک', icon: '/bank-icons/Post.svg' },
  { title: 'بانک خاورمیانه', icon: '/bank-icons/khavar-miyaneh.svg' },
  { title: 'بانک توسعه صادرات', icon: '/bank-icons/Tosee_Saderat.svg' },
  { title: 'بانک مسکن', icon: '/bank-icons/Maskan.svg' },
  { title: 'بانک سینا', icon: '/bank-icons/Sina.svg' },
  { title: 'بانک سرمایه', icon: '/bank-icons/Sarmaye.svg' },
  { title: 'بانک توسعه تعاون', icon: '/bank-icons/Tose_Taeavon.svg' },
  { title: 'بانک رسالت', icon: '/bank-icons/Resalat.svg' },
  { title: 'بانک اقتصاد نوین', icon: '/bank-icons/Eghtesad-Novin.svg' },
  { title: 'بانک مهر ایران', icon: '/bank-icons/Mehr-iran.svg' },
  { title: 'بانک صادرات', icon: '/bank-icons/Saderat.svg' },
  { title: 'بانک رفاه', icon: '/bank-icons/Refah.svg' },
  { title: 'بانک پارسیان', icon: '/bank-icons/Parsian.svg' },
  { title: 'بانک توسعه', icon: '/bank-icons/Tosee.svg' },
  { title: 'بانک تجارت', icon: '/bank-icons/tejarat.svg' },
  { title: 'بانک کشاورزی', icon: '/bank-icons/Agri_Bank.svg' },
  { title: 'بانک ملت', icon: '/bank-icons/Mellat.svg' },
  { title: 'بانک صنعت و معدن', icon: '/bank-icons/Saneat-va-Maedan.svg' },
  { title: 'بانک کارآفرین', icon: '/bank-icons/Karafarin.svg' },
  { title: 'بانک دی', icon: '/bank-icons/Dey.svg' },
  { title: 'بانک گردشگری', icon: '/bank-icons/Gardeshgari.svg' },
]

const normalizeBankTitle = value => String(value || '')
  .replace(/^بانک\s+/, '')
  .replace(/^مؤسسه\s+/, '')
  .replace(/^موسسه\s+/, '')
  .replace(/\s+/g, '')
  .trim()

export const getBankCatalogItem = title => {
  const normalized = normalizeBankTitle(title)
  return BANK_CATALOG.find(bank => normalizeBankTitle(bank.title) === normalized)
}

export const getBankIcon = title => getBankCatalogItem(title)?.icon || ''

export const createBankRecord = (title, patch = {}) => {
  const catalog = getBankCatalogItem(title)
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title,
    icon: catalog?.icon || '',
    hasCheckbook: false,
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}
