const MONEY_FIELDS = ['amount', 'receivedAmount']
const COLLECTIONS = ['expenses', 'incomes', 'checksAndDebts', 'debts', 'currentExpenses']

const convertItem = (item, factor) => MONEY_FIELDS.reduce(
  (result, field) => field in result ? { ...result, [field]: Math.round(Number(result[field] || 0) * factor) } : result,
  { ...item },
)

export function convertFinanceData(data, from, to) {
  const factor = from === 'ریال' && to === 'تومان' ? 0.1 : from === 'تومان' && to === 'ریال' ? 10 : 1
  const converted = { ...data, currency: to }
  if (factor === 1) return converted
  COLLECTIONS.forEach(key => { converted[key] = data[key].map(item => convertItem(item, factor)) })
  converted.histories = data.histories.map(history => ({ ...history, item: convertItem(history.item, factor) }))
  return converted
}
